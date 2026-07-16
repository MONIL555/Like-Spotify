import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CachedTrack from '@/models/CachedTrack';

export async function GET(req: NextRequest) {
  try {
    const videoId = req.nextUrl.searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    await connectDB();

    const cachedTrack = await CachedTrack.findOne({ videoId }).lean();
    
    if (!cachedTrack) {
      return NextResponse.json({ status: 'not_found' });
    }

    return NextResponse.json({ 
      status: cachedTrack.status, 
      audioUrl: cachedTrack.audioUrl 
    });

  } catch (error) {
    console.error('Error in cache-track status API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
