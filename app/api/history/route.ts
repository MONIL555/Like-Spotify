import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import { apiLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';
import ListeningHistory from '@/models/ListeningHistory';
import Track from '@/models/Track';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);

    const token = req.cookies.get('access_token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const jwtUser = verifyAccessToken(token);

    const body = await req.json();
    const { videoId, duration, source } = body;

    if (!videoId) return NextResponse.json({ error: 'videoId is required' }, { status: 400 });

    await connectDB();

    // Ensure the track metadata exists in the DB so it can be populated in recommendations
    const existingTrack = await Track.findOne({ videoId });
    if (!existingTrack && body.trackData) {
      // Create it if we passed the trackData
      await Track.create({
        videoId: body.trackData.videoId,
        title: body.trackData.title,
        artist: body.trackData.artist,
        channelId: body.trackData.channelId,
        channelTitle: body.trackData.channelTitle,
        thumbnails: body.trackData.thumbnails,
        duration: body.trackData.duration,
        durationText: body.trackData.durationText,
        publishedAt: body.trackData.publishedAt,
      });
    }

    await ListeningHistory.create({
      userId: jwtUser.userId,
      videoId,
      duration,
      source: source || 'queue',
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('History POST Error:', error);
    return NextResponse.json({ error: 'Failed to record history' }, { status: 500 });
  }
}
