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

    // Run ALL data fetches in parallel — no sequential waterfall
    const [recentlyPlayedRaw, rawNewReleasesSearch, rawAdminPicks] = await Promise.all([
      // 1. Recently played (only for non-admin users)
      (jwtUser && jwtUser.role !== 'admin')
        ? (async () => {
            const history = await ListeningHistory.aggregate([
              { $match: { userId: new mongoose.Types.ObjectId(jwtUser.userId) } },
              { $sort: { listenedAt: -1 } },
              { $group: { _id: '$videoId', listenedAt: { $first: '$listenedAt' } }},
              { $sort: { listenedAt: -1 } },
              { $limit: 10 }
            ]);
            if (history.length > 0) {
              const videoIds = history.map((h: any) => h._id);
              const tracks = await Track.find({ videoId: { $in: videoIds } }).lean();
              return videoIds.map((id: string) => tracks.find(t => t.videoId === id)).filter(Boolean);
            }
            return [];
          })()
        : Promise.resolve([]),
      // 2. Trending search from JioSaavn
      searchSaavn(newReleasesQuery, 15).catch(() => []),
      // 3. Admin picks from MongoDB
      CuratedTrack.find({ category: 'admin_picks' }).lean().catch(() => []),
    ]);

    const recentlyPlayed = recentlyPlayedRaw as any[];

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

    // Shuffle and return all Admin Picks (the frontend limits to 10 for the home page, but shows all on the dedicated page)
    const shuffledAdminPicks = [...rawAdminPicks].sort(() => Math.random() - 0.5);

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

    const response = NextResponse.json({
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
    response.headers.set('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
    return response;

  } catch (error: any) {
    console.error('Recommendations GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}
