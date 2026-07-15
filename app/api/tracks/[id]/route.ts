import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { apiLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';
import { getVideoDetails } from '@/lib/youtube';
import Track from '@/models/Track';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);
    
    // Await params as required in Next.js 15
    const resolvedParams = await params;
    const { id: videoId } = resolvedParams;

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    await connectDB();

    // Check DB first
    let track = await Track.findOne({ videoId }).lean();

    if (!track) {
      // Fetch from YouTube
      const ytDetails = await getVideoDetails([videoId]);
      if (ytDetails.length > 0) {
        const item = ytDetails[0];
        
        // Save to DB
        track = await Track.create({
          videoId: item.videoId,
          title: item.title,
          artist: item.channelTitle,
          channelId: item.channelId,
          channelTitle: item.channelTitle,
          thumbnails: item.thumbnails,
          duration: item.duration,
          durationText: item.durationText,
          publishedAt: new Date(item.publishedAt),
          tags: item.tags,
        });
      } else {
        return NextResponse.json({ error: 'Track not found' }, { status: 404 });
      }
    }

    return NextResponse.json(track);

  } catch (error: any) {
    console.error('Track API Error:', error);
    if (error.statusCode === 429) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    return NextResponse.json(
      { error: 'An error occurred while fetching the track.' },
      { status: 500 }
    );
  }
}
