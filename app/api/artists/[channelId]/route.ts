import { NextRequest, NextResponse } from 'next/server';
import { apiLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';
import { getChannelDetails, getChannelPlaylists } from '@/lib/youtube';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);
    
    const resolvedParams = await params;
    const { channelId } = resolvedParams;

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 });
    }

    const [channel, playlistsResponse] = await Promise.all([
      getChannelDetails(channelId),
      getChannelPlaylists(channelId, 10), // Limit to top 10 for overview
    ]);

    if (!channel) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    // Format response
    return NextResponse.json({
      artist: {
        id: channel.channelId,
        name: channel.name,
        description: channel.description,
        thumbnailUrl: channel.thumbnailUrl,
        bannerUrl: channel.bannerUrl,
        followers: channel.subscriberCount,
      },
      albums: playlistsResponse.items?.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
        publishedAt: item.snippet.publishedAt,
        trackCount: item.contentDetails?.itemCount || 0,
      })) || [],
    });

  } catch (error: any) {
    console.error('Artist API Error:', error);
    if (error.statusCode === 429) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    return NextResponse.json({ error: 'Failed to fetch artist details' }, { status: 500 });
  }
}
