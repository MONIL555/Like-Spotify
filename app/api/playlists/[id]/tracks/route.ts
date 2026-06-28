import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import { apiLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';
import Playlist from '@/models/Playlist';

async function getUserFromReq(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);
    
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const jwtUser = await getUserFromReq(req);
    if (!jwtUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { videoId } = await req.json();
    if (!videoId) return NextResponse.json({ error: 'videoId is required' }, { status: 400 });

    await connectDB();
    const playlist = await Playlist.findById(id);
    if (!playlist) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });

    const isOwner = playlist.owner.toString() === jwtUser.userId;
    const isCollaborator = playlist.collaborators.some((c: any) => c.toString() === jwtUser.userId);

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if already in playlist (optional, Spotify allows dupes, but we can prevent or allow it)
    // For simplicity, we just add it to the end.
    const position = playlist.tracks.length;
    
    playlist.tracks.push({
      videoId,
      addedBy: jwtUser.userId as any, // Cast to any to avoid ObjectId typing issue
      addedAt: new Date(),
      position,
    });

    await playlist.save();
    return NextResponse.json({ success: true, position });

  } catch (error: any) {
    console.error('Playlist add track Error:', error);
    return NextResponse.json({ error: 'Failed to add track' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);
    
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const jwtUser = await getUserFromReq(req);
    if (!jwtUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const videoId = url.searchParams.get('videoId');
    if (!videoId) return NextResponse.json({ error: 'videoId is required' }, { status: 400 });

    await connectDB();
    const playlist = await Playlist.findById(id);
    if (!playlist) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });

    const isOwner = playlist.owner.toString() === jwtUser.userId;
    const isCollaborator = playlist.collaborators.some((c: any) => c.toString() === jwtUser.userId);

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find index of first occurrence and remove
    const index = playlist.tracks.findIndex((t: any) => t.videoId === videoId);
    if (index > -1) {
      playlist.tracks.splice(index, 1);
      
      // Update positions
      playlist.tracks.forEach((t: any, idx: number) => {
        t.position = idx;
      });

      await playlist.save();
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to remove track' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);
    
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const jwtUser = await getUserFromReq(req);
    if (!jwtUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { from, to } = await req.json();
    if (typeof from !== 'number' || typeof to !== 'number') {
      return NextResponse.json({ error: 'from and to indices required' }, { status: 400 });
    }

    await connectDB();
    const playlist = await Playlist.findById(id);
    if (!playlist) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });

    const isOwner = playlist.owner.toString() === jwtUser.userId;
    const isCollaborator = playlist.collaborators.some((c: any) => c.toString() === jwtUser.userId);

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Reorder array
    const item = playlist.tracks.splice(from, 1)[0];
    playlist.tracks.splice(to, 0, item);

    // Update positions
    playlist.tracks.forEach((t: any, idx: number) => {
      t.position = idx;
    });

    await playlist.save();
    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to reorder tracks' }, { status: 500 });
  }
}
