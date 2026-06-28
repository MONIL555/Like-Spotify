import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import { apiLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';
import Playlist from '@/models/Playlist';
import Track from '@/models/Track';
import User from '@/models/User';
import { UpdatePlaylistSchema } from '@/lib/validations';
import { z } from 'zod';
import { getVideoDetails } from '@/lib/youtube';

async function getUserFromReq(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);
    
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const jwtUser = await getUserFromReq(req);

    await connectDB();

    const playlist = await Playlist.findById(id).populate('owner', 'displayName username avatarUrl');
    
    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    const isOwner = jwtUser && playlist.owner._id.toString() === jwtUser.userId;
    const isCollaborator = jwtUser && playlist.collaborators.some((collab: any) => collab.toString() === jwtUser.userId);

    if (!playlist.isPublic && !isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Process tracks: Fetch missing tracks from YouTube, just like in Liked Songs
    const trackIds = playlist.tracks.map((t: any) => t.videoId);
    let finalTracks: any[] = [];
    
    if (trackIds.length > 0) {
      const dbTracks = await Track.find({ videoId: { $in: trackIds } });
      const dbTrackIds = dbTracks.map(t => t.videoId);
      
      const missingIds = trackIds.filter((id: string) => !dbTrackIds.includes(id));
      let newlyFetchedTracks: any[] = [];

      if (missingIds.length > 0) {
        const chunkSize = 50;
        for (let i = 0; i < missingIds.length; i += chunkSize) {
          const chunk = missingIds.slice(i, i + chunkSize);
          const ytDetails = await getVideoDetails(chunk);
          
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

      const allTracks = [...dbTracks, ...newlyFetchedTracks];
      
      // Merge playlist track info (addedAt, addedBy) with track metadata
      finalTracks = playlist.tracks.map((pt: any) => {
        const metadata = allTracks.find(t => t.videoId === pt.videoId);
        return {
          ...metadata?.toObject(),
          _playlistData: pt,
        };
      }).filter(t => t.videoId); // Filter out any that completely failed to load
    }

    const responseData = {
      ...playlist.toObject(),
      tracks: finalTracks,
    };

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Playlist GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 });
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

    const body = await req.json();
    const validated = UpdatePlaylistSchema.parse(body);

    await connectDB();

    const playlist = await Playlist.findById(id);
    if (!playlist) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isOwner = playlist.owner.toString() === jwtUser.userId;
    const isCollaborator = playlist.collaborators.some((collab: any) => collab.toString() === jwtUser.userId);

    // Only owner can update metadata, collaborators can only update tracks (handled elsewhere)
    if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (validated.name !== undefined) playlist.name = validated.name;
    if (validated.description !== undefined) playlist.description = validated.description;
    if (validated.isPublic !== undefined) playlist.isPublic = validated.isPublic;
    if (validated.isCollaborative !== undefined) playlist.isCollaborative = validated.isCollaborative;
    if (validated.coverImageUrl !== undefined) playlist.coverImageUrl = validated.coverImageUrl;

    await playlist.save();

    return NextResponse.json(playlist);

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 });
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

    await connectDB();

    const playlist = await Playlist.findById(id);
    if (!playlist) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (playlist.owner.toString() !== jwtUser.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Playlist.findByIdAndDelete(id);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 });
  }
}
