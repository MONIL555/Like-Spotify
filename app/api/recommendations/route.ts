import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import { apiLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';
import ListeningHistory from '@/models/ListeningHistory';
import Track from '@/models/Track';
import CuratedTrack from '@/models/CuratedTrack';
import mongoose from 'mongoose';
import { getRelatedVideos } from '@/lib/youtube';
import { searchSaavn } from '@/lib/jiosaavn';

async function getUserFromReq(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);

    const jwtUser = await getUserFromReq(req);
    await connectDB();

    let recentlyPlayed: any[] = [];

    if (jwtUser && jwtUser.role !== 'admin') {
      // Get most recent unique videoIds from history
      const history = await ListeningHistory.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(jwtUser.userId) } },
        { $sort: { listenedAt: -1 } },
        { $group: {
            _id: '$videoId',
            listenedAt: { $first: '$listenedAt' }
        }},
        { $sort: { listenedAt: -1 } },
        { $limit: 10 }
      ]);

      if (history.length > 0) {
        const videoIds = history.map((h: any) => h._id);
        const tracks = await Track.find({ videoId: { $in: videoIds } }).lean();
        
        // Map back to preserve sorted order
        recentlyPlayed = videoIds.map((id: string) => {
          const track = tracks.find(t => t.videoId === id);
          return track ? track : null;
        }).filter(Boolean);
      }
    }

    const currentYear = new Date().getFullYear();
    const hourBlock = Math.floor(new Date().getHours() / 4);
    
    const trendingQueries = [
      `Arijit Singh Hits`,
      `Darshan Raval Songs`,
      `Badshah Bollywood`,
      `Shreya Ghoshal Hits`,
      `Jubin Nautiyal Top`,
      `Neha Kakkar Hits`,
      `Kishore Kumar Hits`,
      `Atif Aslam Songs`,
      `Diljit Dosanjh Hits`,
      `Honey Singh Bollywood`
    ];
    const newReleasesQuery = trendingQueries[hourBlock % trendingQueries.length];

    // Fetch New Releases
    let newReleasesSearchPromise = searchSaavn(newReleasesQuery, 15).catch(() => ([]));
    
    // Fetch Admin Picks (formerly "Jump Back In")
    let adminPicksPromise = CuratedTrack.find({ category: 'admin_picks' }).lean().catch(() => ([]));

    const [rawNewReleasesSearch, rawAdminPicks] = await Promise.all([
      newReleasesSearchPromise, 
      adminPicksPromise
    ]);

    // Deduplicate to avoid the same song from different albums (e.g., 5 versions of Jaan Nisaar)
    const deduplicateTracks = (tracks: any[]) => {
      return Array.from(new Map(
        tracks.map((t: any) => {
          const baseTitle = (t.title || '').split('(')[0].split('-')[0].trim().toLowerCase();
          return [baseTitle, t];
        })
      ).values());
    };

    const newReleasesSearch = deduplicateTracks(rawNewReleasesSearch);
    
    const newReleases = newReleasesSearch.map((item: any) => ({
      id: item.videoId || item.id,
      title: item.title,
      description: item.artist || item.channelTitle || 'Unknown Artist',
      imageUrl: item.thumbnails?.high || item.thumbnails?.default || item.thumbnail,
      type: 'track',
      data: item
    }));

    // Shuffle and pick 10 tracks for Admin Picks
    const shuffledAdminPicks = [...rawAdminPicks].sort(() => Math.random() - 0.5).slice(0, 10);

    const madeForYou = shuffledAdminPicks.map((item: any) => ({
      id: item.videoId,
      title: item.title,
      description: item.artist,
      imageUrl: item.imageUrl,
      type: 'track',
      data: {
        videoId: item.videoId,
        saavnId: item.saavnId,
        source: item.source,
        title: item.title,
        artist: item.artist,
        channelTitle: item.artist,
        thumbnails: { default: item.imageUrl, high: item.imageUrl },
      }
    }));

    return NextResponse.json({
      recentlyPlayed: recentlyPlayed.map((t: any) => ({
        id: t.videoId,
        title: t.title,
        description: t.artist,
        imageUrl: t.thumbnails?.high || t.thumbnails?.default,
        type: 'track',
        data: t
      })),
      newReleases,
      madeForYou
    });

  } catch (error: any) {
    console.error('Recommendations GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}
