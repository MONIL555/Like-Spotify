import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import { apiLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';
import { getVideoDetails } from '@/lib/youtube';
import User from '@/models/User';
import Track from '@/models/Track';
import CachedTrack from '@/models/CachedTrack';

async function getUserFromReq(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    return verifyAccessToken(token);
  } catch (e) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);

    const jwtUser = await getUserFromReq(req);
    if (!jwtUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const user = await User.findById(jwtUser.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const likedIds = user.likedTrackIds || [];
    if (likedIds.length === 0) {
      return NextResponse.json([]);
    }

    // 1. Fetch what we can from DB
    const dbTracks = await Track.find({ videoId: { $in: likedIds } }).lean();
    const dbTrackIds = dbTracks.map(t => t.videoId);
    
    // 2. Determine what's missing
    const missingIds = likedIds.filter(id => !dbTrackIds.includes(id));
    let newlyFetchedTracks: any[] = [];

    // 3. Fetch missing from YouTube API
    if (missingIds.length > 0) {
      // Chunk into groups of 50 for the YouTube API
      const chunkSize = 50;
      for (let i = 0; i < missingIds.length; i += chunkSize) {
        const chunk = missingIds.slice(i, i + chunkSize);
        const ytDetails = await getVideoDetails(chunk);
        
        // Cache them in DB
        const toInsert = ytDetails.map(item => ({
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
        }));

        if (toInsert.length > 0) {
          const inserted = await Track.insertMany(toInsert);
          newlyFetchedTracks = [...newlyFetchedTracks, ...inserted];
        }
      }
    }

    // Combine and sort to match original likedIds order (last liked first)
    const allTracks = [...dbTracks, ...newlyFetchedTracks];
    const orderedTracks = likedIds
      .map(id => allTracks.find(t => t.videoId === id))
      .filter(Boolean)
      .reverse(); // Reverse so newest is first

    // Inject cached track info so cached tracks can play directly from cache
    const cachedTracks = await CachedTrack.find({ videoId: { $in: likedIds }, status: 'ready' }).lean();
    const cachedMap = new Map();
    cachedTracks.forEach((ct: any) => cachedMap.set(ct.videoId, ct));

    const enrichedTracks = orderedTracks.map(t => {
      const ct = cachedMap.get(t.videoId);
      if (ct) {
        return {
          ...t,
          source: ct.source || 'pagalworld_cached',
          audioUrl: ct.audioUrl,
        };
      }
      return t;
    });

    return NextResponse.json(enrichedTracks);

  } catch (error: any) {
    console.error('Liked Library GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch liked songs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);

    const jwtUser = await getUserFromReq(req);
    if (!jwtUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoId } = await req.json();
    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    await connectDB();
    
    const user = await User.findById(jwtUser.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isLiked = user.likedTrackIds?.includes(videoId);
    
    if (isLiked) {
      // Unlike
      user.likedTrackIds = user.likedTrackIds.filter(id => id !== videoId);
    } else {
      // Like
      if (!user.likedTrackIds) user.likedTrackIds = [];
      user.likedTrackIds.push(videoId);
    }

    await user.save();

    return NextResponse.json({ liked: !isLiked });

  } catch (error: any) {
    console.error('Liked Library POST Error:', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
