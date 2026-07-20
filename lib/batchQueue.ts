import connectDB from '@/lib/mongodb';
import ListeningHistory from '@/models/ListeningHistory';
import Track from '@/models/Track';

interface HistoryItem {
  userId: string;
  videoId: string;
  duration: number;
  source: string;
}

interface TrackItem {
  videoId: string;
  title: string;
  artist: string;
  channelId?: string;
  channelTitle?: string;
  thumbnails?: any[];
  duration?: number;
  durationText?: string;
  publishedAt?: string | Date;
}

const historyQueue: HistoryItem[] = [];
const trackQueue: Map<string, TrackItem> = new Map();
let isFlushing = false;

// Fix HMR interval leak by using global object in development
declare global {
  var _batchQueueInterval: NodeJS.Timeout | undefined;
}

export function enqueueHistory(item: HistoryItem, trackData?: TrackItem) {
  // CR-01 Fix: Cap queue size to prevent OOM
  if (historyQueue.length >= 5000) {
    console.warn('Batch queue full, dropping history event');
    return;
  }

  historyQueue.push(item);
  
  if (trackData) {
    // Overwrite with the latest track data if multiple occur
    trackQueue.set(trackData.videoId, trackData);
  }

  // Start the flush interval if not already started
  if (!global._batchQueueInterval) {
    global._batchQueueInterval = setInterval(flushQueues, 10000); // Flush every 10 seconds
  }
}

async function flushQueues() {
  if (isFlushing) return;
  
  const historyToInsert = [...historyQueue];
  const tracksToUpsert = Array.from(trackQueue.values());
  
  if (historyToInsert.length === 0 && tracksToUpsert.length === 0) return;
  
  isFlushing = true;
  historyQueue.length = 0; // Clear the queue
  trackQueue.clear();

  try {
    await connectDB();

    // 1. Bulk Upsert Tracks
    if (tracksToUpsert.length > 0) {
      const trackOps = tracksToUpsert.map(track => {
        const updateData = { ...track } as any;
        if (typeof updateData.publishedAt === 'string') {
          updateData.publishedAt = new Date(updateData.publishedAt);
        }
        return {
          updateOne: {
            filter: { videoId: track.videoId },
            update: { $set: updateData },
            upsert: true,
          }
        };
      });
      await Track.bulkWrite(trackOps, { ordered: false });
    }

    // 2. Insert Many Histories
    if (historyToInsert.length > 0) {
      await ListeningHistory.insertMany(historyToInsert, { ordered: false });
    }
  } catch (error) {
    console.error('Batch Queue Flush Error:', error);
    // On error, push items back to retry later, respecting cap
    if (historyQueue.length < 5000) {
      historyQueue.push(...historyToInsert.slice(0, 5000 - historyQueue.length));
    }
    tracksToUpsert.forEach(t => trackQueue.set(t.videoId, t));
  } finally {
    isFlushing = false;
  }
}
