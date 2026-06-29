import { NextRequest, NextResponse } from 'next/server';
import { searchYouTube } from '@/lib/youtube';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');
    const title = searchParams.get('title');
    const artist = searchParams.get('artist');

    if (!videoId) {
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
    }

    // Simulate YouTube's mix algorithm by searching for a mix based on the artist and title,
    // and avoiding compilations.
    const query = `${artist} ${title} similar artists songs`;
    
    const searchResults = await searchYouTube(query, 15);

    // Filter out the exact same song and compilations
    const filteredItems = searchResults.items.filter((item: any) => {
      if (item.videoId === videoId) return false;
      const itemTitle = item.title.toLowerCase();
      const isCompilation = /(top \d+|best of|mashup|jukebox|compilation|full album|audio jukebox|collection)/i.test(itemTitle);
      if (isCompilation) return false;
      return true;
    });

    // Pick a random track from the top 5 to make it feel like a dynamic mix
    const topItems = filteredItems.slice(0, 5);
    const nextItem = topItems[Math.floor(Math.random() * topItems.length)] || searchResults.items[0];

    if (!nextItem) {
      return NextResponse.json({ error: 'No similar tracks found' }, { status: 404 });
    }

    return NextResponse.json({
      track: {
        id: nextItem.videoId,
        videoId: nextItem.videoId,
        title: nextItem.title,
        artist: nextItem.channelName,
        albumName: 'Autoplay Mix',
        thumbnails: {
          default: nextItem.thumbnail,
          high: nextItem.thumbnail,
        },
        duration: 0,
        type: 'track'
      }
    });
  } catch (error: any) {
    console.error('Autoplay GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch autoplay track' }, { status: 500 });
  }
}
