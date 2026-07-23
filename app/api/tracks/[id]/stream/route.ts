import { NextRequest, NextResponse } from 'next/server';
import { getSaavnTrackDetails } from '@/lib/jiosaavn';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if it's a saavn ID or a youtube fallback ID
    if (id.startsWith('saavn_')) {
      const realSaavnId = id.replace('saavn_', '');
      const track = await getSaavnTrackDetails(realSaavnId);
      
      if (!track || !track.streamUrl) {
        return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
      }
      
      return NextResponse.json({ streamUrl: track.streamUrl, source: 'jiosaavn' }, {
        headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' },
      });
    }
    
    // If it's just a regular JioSaavn ID (no prefix)
    const track = await getSaavnTrackDetails(id);
    if (track && track.streamUrl) {
      return NextResponse.json({ streamUrl: track.streamUrl, source: 'jiosaavn' }, {
        headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' },
      });
    }

    // Check CachedTrack collection
    try {
      const connectDB = (await import('@/lib/mongodb')).default;
      await connectDB();
      const CachedTrack = (await import('@/models/CachedTrack')).default;
      const cached = await CachedTrack.findOne({ videoId: id, status: 'ready' }).lean();
      if (cached && cached.audioUrl) {
        return NextResponse.json({ streamUrl: cached.audioUrl, source: 'pagalworld_cached' }, {
          headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' },
        });
      }
    } catch (e) {
      console.warn('Error checking CachedTrack:', e);
    }

    return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Stream API Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the stream URL.' },
      { status: 500 }
    );
  }
}
