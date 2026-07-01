import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import { apiLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';
import Playlist from '@/models/Playlist';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);

    const token = req.cookies.get('access_token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const jwtUser = verifyAccessToken(token);

    await connectDB();

    const playlists = await Playlist.find({ userId: jwtUser.userId }).sort({ createdAt: -1 });

    return NextResponse.json(playlists);
  } catch (error: any) {
    console.error('Playlists GET Error:', error);
    return NextResponse.json({ error: 'Failed to get playlists' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);

    const token = req.cookies.get('access_token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const jwtUser = verifyAccessToken(token);

    const body = await req.json();
    const { name } = body;

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    await connectDB();

    const playlist = await Playlist.create({
      userId: jwtUser.userId,
      name,
      tracks: [],
    });

    return NextResponse.json(playlist);
  } catch (error: any) {
    console.error('Playlists POST Error:', error);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}
