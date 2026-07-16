import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CachedTrack from '@/models/CachedTrack';
import { storageAdmin } from '@/lib/firebase-admin';

// Protect these routes to admin only? 
// For now, assume it's protected by middleware or we can add a simple check if needed.

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    
    let query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { artist: { $regex: search, $options: 'i' } }
      ];
    }

    const tracks = await CachedTrack.find(query).sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json(tracks);
  } catch (error) {
    console.error('Error fetching cached tracks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { videoId, title, artist, audioUrl, coverUrl } = body;

    if (!videoId || !title || !artist || !audioUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Wrap external URLs with our stream proxy to bypass CORS restrictions in the audio visualizer
    // We use a RELATIVE URL so it works automatically on mobile devices (network IPs)
    let finalAudioUrl = audioUrl;
    if (finalAudioUrl.startsWith('http') && !finalAudioUrl.includes('/api/stream-proxy')) {
      finalAudioUrl = `/api/stream-proxy?url=${encodeURIComponent(finalAudioUrl)}`;
    }

    // Check if it already exists
    let track = await CachedTrack.findOne({ videoId });
    if (track) {
      // Update existing
      track.status = 'ready';
      track.title = title;
      track.artist = artist;
      track.audioUrl = finalAudioUrl;
      track.source = 'admin_manual';
      
      if (coverUrl) {
        track.thumbnails = {
          default: { url: coverUrl, width: 150, height: 150 },
          high: { url: coverUrl, width: 500, height: 500 }
        };
      }
      await track.save();
    } else {
      // Create new
      track = new CachedTrack({
        videoId,
        title,
        artist,
        audioUrl: finalAudioUrl,
        source: 'admin_manual',
        status: 'ready',
        cachedBy: 'admin',
        thumbnails: coverUrl ? {
          default: { url: coverUrl, width: 150, height: 150 },
          high: { url: coverUrl, width: 500, height: 500 }
        } : undefined
      });
      await track.save();
    }

    return NextResponse.json({ message: 'Track manually cached successfully', track });
  } catch (error) {
    console.error('Error adding manual cached track:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const track = await CachedTrack.findById(id);
    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // If there is an audioUrl hosted on our Firebase, delete it
    if (track.audioUrl && (track.audioUrl.includes('firebasestorage.googleapis.com') || track.audioUrl.includes('storage.googleapis.com'))) {
      try {
        const bucket = storageAdmin.bucket();
        // Extract file path from URL
        // e.g. https://storage.googleapis.com/bucket-name/cached_audio/123.mp3
        const parts = track.audioUrl.split('/cached_audio/');
        if (parts.length === 2) {
          const filePath = `cached_audio/${parts[1].split('?')[0]}`;
          await bucket.file(filePath).delete();
          console.log(`Deleted Firebase file: ${filePath}`);
        }
      } catch (e) {
        console.error('Failed to delete file from Firebase:', e);
        // Continue deleting from DB even if Firebase delete fails
      }
    }

    await CachedTrack.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Track deleted successfully' });
  } catch (error) {
    console.error('Error deleting cached track:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
