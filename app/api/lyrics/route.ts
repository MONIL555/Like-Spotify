import { NextRequest, NextResponse } from 'next/server';
import { apiLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);

    const url = new URL(req.url);
    const track = url.searchParams.get('track');
    const artist = url.searchParams.get('artist');

    if (!track) {
      return NextResponse.json({ error: 'Track title is required' }, { status: 400 });
    }

    // Proxy request to lrclib.net
    let fetchUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(track)}`;
    if (artist) {
      fetchUrl += `&artist_name=${encodeURIComponent(artist)}`;
    }

    const res = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'SpotTunes-NextJS/0.1.0' // lrclib requires a User-Agent
      },
      next: { revalidate: 86400 } // Cache for 24 hours
    });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: 'Lyrics not found' }, { status: 404 });
      }
      throw new Error(`lrclib error: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Lyrics API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch lyrics' }, { status: 500 });
  }
}
