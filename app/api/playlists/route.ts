import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import { apiLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';
import Playlist from '@/models/Playlist';
import { CreatePlaylistSchema } from '@/lib/validations';
import { z } from 'zod';

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
    if (!jwtUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const playlists = await Playlist.find({
      $or: [
        { owner: jwtUser.userId },
        { collaborators: jwtUser.userId }
      ]
    }).sort({ createdAt: -1 });

    return NextResponse.json(playlists);

  } catch (error: any) {
    console.error('Playlists GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
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

    const body = await req.json();
    const validated = CreatePlaylistSchema.parse(body);

    await connectDB();

    const newPlaylist = await Playlist.create({
      name: validated.name,
      description: validated.description || '',
      isPublic: validated.isPublic,
      isCollaborative: validated.isCollaborative,
      owner: jwtUser.userId,
      tracks: [],
    });

    return NextResponse.json(newPlaylist, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).issues[0].message }, { status: 400 });
    }
    console.error('Playlists POST Error:', error);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}
