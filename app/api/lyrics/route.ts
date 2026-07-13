import { NextRequest, NextResponse } from 'next/server';
import { apiLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';

function cleanTitle(title: string) {
  return title
    .replace(/\[.*?\]/g, '') // remove brackets
    .replace(/\(.*?\)/g, '') // remove parentheses
    .replace(/\|.*/g, '') // remove anything after pipe
    .replace(/-.*/g, '') // remove anything after dash
    .trim();
}

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);

    const url = new URL(req.url);
    const rawTrack = url.searchParams.get('track');
    const artist = url.searchParams.get('artist');

    if (!rawTrack) {
      return NextResponse.json({ error: 'Track title is required' }, { status: 400 });
    }

    const track = cleanTitle(rawTrack);

    // 1. Try exact match first
    let fetchUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(track)}`;
    if (artist) {
      fetchUrl += `&artist_name=${encodeURIComponent(artist)}`;
    }

    const headers = { 'User-Agent': 'SpotTunes-NextJS/0.1.0' };
    let res = await fetch(fetchUrl, { headers, next: { revalidate: 86400 } });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    // 2. Fallback to search if not found or bad request
    if (res.status === 404 || res.status === 400) {
      const query = artist ? `${track} ${artist}` : track;
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
      const searchRes = await fetch(searchUrl, { headers, next: { revalidate: 86400 } });
      
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (Array.isArray(searchData) && searchData.length > 0) {
          // Return the first best match
          return NextResponse.json(searchData[0]);
        }
      }
      return NextResponse.json({ error: 'Lyrics not found' }, { status: 404 });
    }

    throw new Error(`lrclib error: ${res.status}`);

  } catch (error: any) {
    console.error('Lyrics API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch lyrics' }, { status: 500 });
  }
}
