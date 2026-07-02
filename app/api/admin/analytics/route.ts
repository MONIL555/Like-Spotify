import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken, handleApiError } from '@/lib/auth';
import User from '@/models/User';
import ListeningHistory from '@/models/ListeningHistory';
import Track from '@/models/Track';
import { getVideoDetails } from '@/lib/youtube';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('access_token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const jwtUser = verifyAccessToken(token);
    if (jwtUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // 1. Total Users
    const totalUsers = await User.countDocuments();

    // 2. Global Listening Time (in seconds)
    const globalListeningResult = await ListeningHistory.aggregate([
      { $group: { _id: null, totalDuration: { $sum: '$duration' } } }
    ]);
    const totalListeningSeconds = globalListeningResult.length > 0 ? globalListeningResult[0].totalDuration : 0;

    // 3. Top Users by Listening Time
    const topUsersAggregate = await ListeningHistory.aggregate([
      { $group: { _id: '$userId', totalDuration: { $sum: '$duration' } } },
      { $sort: { totalDuration: -1 } },
      { $limit: 20 }
    ]);

    // Populate user details for top users
    const topUsers = await Promise.all(topUsersAggregate.map(async (item) => {
      const user = await User.findById(item._id).select('username email displayName avatarUrl plan');
      return {
        _id: item._id,
        user: user ? user.toObject() : null,
        totalDuration: item.totalDuration
      };
    }));

    // Filter out null users (deleted users)
    const validTopUsers = topUsers.filter(u => u.user !== null);

    // 4. Top Tracks
    const topTracksAggregate = await ListeningHistory.aggregate([
      { $group: { _id: '$videoId', playCount: { $sum: 1 }, totalDuration: { $sum: '$duration' } } },
      { $sort: { playCount: -1 } },
      { $limit: 10 }
    ]);

    const topTracks = await Promise.all(topTracksAggregate.map(async (item) => {
      let track = await Track.findOne({ videoId: item._id });
      
      let title = track?.title;
      let artist = track?.artist;
      let thumbnails = track?.thumbnails;

      if (!track) {
        try {
          const ytDetails = await getVideoDetails([item._id]);
          if (ytDetails && ytDetails.length > 0) {
            title = ytDetails[0].title;
            artist = ytDetails[0].channelTitle;
            thumbnails = ytDetails[0].thumbnails;
            
            await Track.create({
              videoId: ytDetails[0].videoId,
              title: title,
              artist: artist,
              channelId: ytDetails[0].channelId,
              channelTitle: artist,
              thumbnails: thumbnails,
              duration: ytDetails[0].duration,
              durationText: ytDetails[0].durationText,
              publishedAt: ytDetails[0].publishedAt,
            });
          }
        } catch (e) {
          console.error("Failed to fetch YT details for", item._id);
        }
      }

      return {
        videoId: item._id,
        playCount: item.playCount,
        totalDuration: item.totalDuration,
        title: title || 'Unknown Title',
        artist: artist || 'Unknown Artist',
        thumbnails: thumbnails
      };
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalListeningSeconds,
        topUsers: validTopUsers,
        topTracks
      }
    });

  } catch (error: any) {
    console.error('Admin Analytics Error:', error);
    if (error.name === 'ApiError') {
      return handleApiError(error);
    }
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
