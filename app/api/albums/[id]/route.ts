import { NextRequest, NextResponse } from 'next/server';
import { apiLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';
import { getPlaylistDetails, getPlaylistItems, getVideoDetails } from '@/lib/youtube';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);
    
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ error: 'Album ID is required' }, { status: 400 });
    }

    // 1. Fetch playlist metadata
    const playlist = await getPlaylistDetails(id);
    if (!playlist) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // 2. Fetch items (tracks)
    const items = await getPlaylistItems(id);
    const videoIds = items.map((i: any) => i.videoId);

    // 3. Fetch full video details to get duration
    let fullTracks = [];
    if (videoIds.length > 0) {
      // Chunking if necessary, but maxResults is 50 so one call is usually fine.
      const videoDetails = await getVideoDetails(videoIds);
      
      fullTracks = items.map((item: any) => {
        const detail = videoDetails.find(v => v.videoId === item.videoId);
        return {
          videoId: item.videoId,
          title: item.title,
          artist: detail?.channelTitle || item.channelTitle,
          channelId: item.channelId,
          channelTitle: item.channelTitle,
          thumbnails: detail?.thumbnails || { default: item.thumbnailUrl, high: item.thumbnailUrl },
          duration: detail?.duration || 0,
          durationText: detail?.durationText || '',
          publishedAt: item.publishedAt,
        };
      });
    }

    return NextResponse.json({
      album: playlist,
      tracks: fullTracks,
    });

  } catch (error: any) {
    console.error('Album API Error:', error);
    if (error.statusCode === 429) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    return NextResponse.json({ error: 'Failed to fetch album details' }, { status: 500 });
  }
}
