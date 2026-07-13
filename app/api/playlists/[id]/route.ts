import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import { apiLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';
import Playlist from '@/models/Playlist';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);

    const token = req.cookies.get('access_token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const jwtUser = verifyAccessToken(token);

    const resolvedParams = await params;

    await connectDB();

    const playlist = await Playlist.findOne({
      _id: resolvedParams.id,
      $or: [{ userId: jwtUser.userId }, { collaborators: jwtUser.userId }]
    }).lean();
    
    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    return NextResponse.json(playlist);
  } catch (error: any) {
    console.error('Playlist GET Error:', error);
    return NextResponse.json({ error: 'Failed to get playlist' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);

    const token = req.cookies.get('access_token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const jwtUser = verifyAccessToken(token);

    const body = await req.json();
    const { track } = body;

    if (!track || !track.videoId) return NextResponse.json({ error: 'Valid track is required' }, { status: 400 });

    const resolvedParams = await params;

    await connectDB();

    const playlist = await Playlist.findOne({
      _id: resolvedParams.id,
      $or: [{ userId: jwtUser.userId }, { collaborators: jwtUser.userId }]
    });
    
    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    // Add track to playlist if it's not already there
    const trackExists = playlist.tracks.some((t: any) => t.videoId === track.videoId);
    if (!trackExists) {
      playlist.tracks.push(track);
      await playlist.save();
    }

    return NextResponse.json(playlist);
  } catch (error: any) {
    console.error('Playlist PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);

    const token = req.cookies.get('access_token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const jwtUser = verifyAccessToken(token);

    const resolvedParams = await params;

    await connectDB();

    const result = await Playlist.deleteOne({ _id: resolvedParams.id, userId: jwtUser.userId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Playlist not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Playlist DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 });
  }
}
