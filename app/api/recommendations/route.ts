import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import { apiLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';
import ListeningHistory from '@/models/ListeningHistory';
import Track from '@/models/Track';
import mongoose from 'mongoose';
import { searchYouTube, getRelatedVideos } from '@/lib/youtube';

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

    if (jwtUser) {
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
        const tracks = await Track.find({ videoId: { $in: videoIds } });
        
        // Map back to preserve sorted order
        recentlyPlayed = videoIds.map((id: string) => {
          const track = tracks.find(t => t.videoId === id);
          return track ? track.toObject() : null;
        }).filter(Boolean);
      }
    }

    // "New Releases" (Trending music search)
    // We'll search for recent music videos
    const newReleasesSearch = await searchYouTube('trending music official video', 10);
    const newReleases = newReleasesSearch.items.map((item: any) => ({
      id: item.videoId,
      title: item.title,
      description: item.channelTitle || item.channelName,
      imageUrl: item.thumbnail,
      type: 'track',
      data: item
    }));

    // "Made For You" (Similar songs based on recent listening or general vibes)
    let madeForYouSearch;
    let artistsToExclude: string[] = [];

    if (recentlyPlayed.length > 0) {
      // Get unique artists
      const recentArtists = Array.from(new Set(recentlyPlayed.map((t: any) => t.artist))).filter(Boolean) as string[];
      artistsToExclude = recentArtists.slice(0, 2).map(a => a.toLowerCase());
      
      const artistsQuery = recentArtists.slice(0, 2).join(' ');
      // Search for a general mix of these artists and others
      madeForYouSearch = await searchYouTube(`${artistsQuery} similar artists songs`, 25);
    } else {
      madeForYouSearch = await searchYouTube('trending pop songs', 15);
    }
    
    // Filter out the exact artists we just listened to AND compilations
    const filteredItems = madeForYouSearch.items.filter((item: any) => {
      const itemTitle = item.title.toLowerCase();
      const itemChannel = (item.channelTitle || item.channelName || '').toLowerCase();
      
      const isSameArtist = artistsToExclude.some(artist => 
        itemTitle.includes(artist) || itemChannel.includes(artist)
      );

      // Exclude listicles, compilations, jukeboxes, and full albums
      const isCompilation = /(top \d+|best of|mashup|jukebox|compilation|full album|audio jukebox|collection)/i.test(itemTitle);
      
      return !isSameArtist && !isCompilation;
    });

    // Fallback if filtering was too aggressive
    const finalItems = filteredItems.length >= 4 ? filteredItems.slice(0, 10) : madeForYouSearch.items.slice(0, 10);

    const madeForYou = finalItems.map((item: any) => ({
      id: item.videoId,
      title: item.title,
      description: item.channelTitle || item.channelName,
      imageUrl: item.thumbnail,
      type: 'track',
      data: item
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
