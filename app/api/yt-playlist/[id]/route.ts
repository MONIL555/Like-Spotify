import { NextRequest, NextResponse } from 'next/server';
import { getPlaylistDetails, getPlaylistItems } from '@/lib/youtube';
import { apiLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const details = await getPlaylistDetails(id);
    if (!details) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    const items = await getPlaylistItems(id, 50);

    const mappedTracks = items.map((item: any) => ({
      videoId: item.videoId,
      title: item.title,
      artist: item.channelTitle,
      thumbnails: { default: { url: item.thumbnailUrl }, high: { url: item.thumbnailUrl } },
      thumbnail: item.thumbnailUrl
    }));

    const response = {
      _id: details.id,
      name: details.title,
      description: details.description,
      userId: details.channelId,
      tracks: mappedTracks,
      isExternal: true
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('YT Playlist GET Error:', error);
    return NextResponse.json({ error: 'Failed to get YouTube playlist' }, { status: 500 });
  }
}
