import { NextRequest, NextResponse } from 'next/server';
import { apiLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';

function cleanTitle(title: string) {
  let cleaned = title
    .replace(/\[.*?\]/g, '') // remove brackets
    .replace(/\(.*?\)/g, '') // remove parentheses
    .replace(/\|.*/g, '') // remove anything after pipe
    .trim();
    
  // Only remove things after dash if it's clearly a video suffix
  cleaned = cleaned.replace(/-(?:\s)*(?:Official|Lyrical|Audio|Video|8K|4K|HD|HQ).*/i, '');
  
  return cleaned.trim();
}

function cleanArtist(artist: string) {
  if (!artist) return '';
  return artist
    .replace(/ - Topic/i, '')
    .replace(/VEVO/i, '')
    .trim();
}

async function transliterate(text: string) {
  if (!text || !/[^\x00-\x7F]/.test(text)) {
    // If empty or only contains ASCII characters, no need to transliterate
    return text;
  }
  
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=rm&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return text;
    
    const data = await res.json();
    if (data && data[0] && Array.isArray(data[0])) {
      const romanized = data[0].map((item: any) => item[3] || '').join('');
      if (romanized.trim().length > 0) {
        return romanized;
      }
    }
    return text;
  } catch (error) {
    console.error("Transliteration error:", error);
    return text;
  }
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
    const cleanArt = cleanArtist(artist || '');

    // 1. Try exact match first
    let fetchUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(track)}`;
    if (cleanArt) {
      fetchUrl += `&artist_name=${encodeURIComponent(cleanArt)}`;
    }

    const headers = { 'User-Agent': 'SpotTunes-NextJS/0.1.0' };
    let res = await fetch(fetchUrl, { headers, next: { revalidate: 86400 } });

    let foundData = null;

    if (res.ok) {
      foundData = await res.json();
    }

    // 2. Fallback to search if not found or bad request
    if (!foundData && (res.status === 404 || res.status === 400)) {
      const query = cleanArt ? `${track} ${cleanArt}` : track;
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
      const searchRes = await fetch(searchUrl, { headers, next: { revalidate: 86400 } });
      
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (Array.isArray(searchData) && searchData.length > 0) {
          // Return the first best match
          foundData = searchData[0];
        }
      }
    }

    if (foundData) {
      // Transliterate lyrics if needed
      if (foundData.plainLyrics) {
        foundData.plainLyrics = await transliterate(foundData.plainLyrics);
      }
      if (foundData.syncedLyrics) {
        foundData.syncedLyrics = await transliterate(foundData.syncedLyrics);
      }
      return NextResponse.json(foundData);
    }

    return NextResponse.json({ error: 'Lyrics not found' }, { status: 404 });

  } catch (error: any) {
    console.error('Lyrics API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch lyrics' }, { status: 500 });
  }
}
