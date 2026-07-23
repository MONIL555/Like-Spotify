import { NextRequest, NextResponse } from 'next/server';
import { apiLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';

const SAAVN_API_BASE = 'https://saavn.dev/api';

function cleanTitle(title: string) {
  if (!title) return '';
  
  let cleaned = title
    // Decode common HTML entities first
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // Remove common video/audio prefixes
    .replace(/^(?:Lyrical(?:\s*Video)?|Official(?:\s*Video|\s*Audio)?|Full\s*Song)[\s:-]+/i, '')
    // Remove JioSaavn-style album references: (From "Album Name"), (From 'Album')
    .replace(/\(From\s*["'][^"']*["']\)/gi, '')
    // Remove brackets with content like [Official Video], [HD], [Lyric Video]
    .replace(/\[.*?\]/g, '')
    // Remove parenthetical content like (Official Video), (Audio), (Lyric), (Full Song)
    .replace(/\(\s*(?:Official|Lyrical?|Audio|Video|Full|HD|HQ|4K|8K|Remix|Version|Original|Motion\s*Picture)[^)]*\)/gi, '')
    // Remove remaining empty parentheses
    .replace(/\(\s*\)/g, '')
    // Remove quality suffixes like "- 320 Kbps", "- 128kbps"
    .replace(/-\s*\d+\s*kbps/gi, '')
    // Remove things after dash that are clearly video suffixes
    .replace(/-(?:\s)*(?:Official|Lyrical|Audio|Video|8K|4K|HD|HQ).*/i, '')
    // Remove anything after pipe
    .replace(/\|.*/g, '')
    .trim();

  return cleaned;
}

function cleanArtist(artist: string) {
  if (!artist) return '';
  return artist
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/ - Topic/i, '')
    .replace(/VEVO/i, '')
    .trim();
}

// Try to fetch lyrics from JioSaavn API
async function fetchSaavnLyrics(saavnId: string): Promise<string | null> {
  try {
    const res = await fetch(`${SAAVN_API_BASE}/songs/${saavnId}/lyrics`, {
      next: { revalidate: 86400 },
    });
    
    if (!res.ok) return null;
    
    const json = await res.json();
    if (json.success && json.data?.lyrics) {
      return json.data.lyrics;
    }
    return null;
  } catch (error) {
    console.error('JioSaavn lyrics fetch error:', error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);

    const url = new URL(req.url);
    const rawTrack = url.searchParams.get('track');
    const artist = url.searchParams.get('artist');
    const saavnId = url.searchParams.get('saavnId');
    const source = url.searchParams.get('source');

    if (!rawTrack) {
      return NextResponse.json({ error: 'Track title is required' }, { status: 400 });
    }

    // 0. Try JioSaavn lyrics first if we have a saavnId
    if (saavnId && (source === 'jiosaavn' || saavnId)) {
      const saavnLyrics = await fetchSaavnLyrics(saavnId);
      if (saavnLyrics) {
        return NextResponse.json({
          plainLyrics: saavnLyrics,
          syncedLyrics: null,
          source: 'jiosaavn',
        }, {
          headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate=172800' },
        });
      }
    }

    // 1. Clean title and artist for lrclib lookup
    const track = cleanTitle(rawTrack);
    const cleanArt = cleanArtist(artist || '');

    const headers = { 'User-Agent': 'MoniStream-NextJS/0.1.0' };

    // 2. Try exact match first
    let fetchUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(track)}`;
    if (cleanArt) {
      fetchUrl += `&artist_name=${encodeURIComponent(cleanArt)}`;
    }

    let res = await fetch(fetchUrl, { headers, next: { revalidate: 86400 } });
    let foundData = null;

    if (res.ok) {
      foundData = await res.json();
    }

    // 3. Fallback to search if not found or bad request
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
      
      // 4. Last fallback: search without artist if artist search failed
      if (!foundData && cleanArt) {
        const fallbackUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(track)}`;
        const fallbackRes = await fetch(fallbackUrl, { headers, next: { revalidate: 86400 } });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (Array.isArray(fallbackData) && fallbackData.length > 0) {
            foundData = fallbackData[0];
          }
        }
      }
    }

    if (foundData) {
      // Return lyrics in their original language — no transliteration
      return NextResponse.json({
        plainLyrics: foundData.plainLyrics || null,
        syncedLyrics: foundData.syncedLyrics || null,
        source: 'lrclib',
      }, {
        headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate=172800' },
      });
    }

    return NextResponse.json({ error: 'Lyrics not found' }, { status: 404 });

  } catch (error: any) {
    console.error('Lyrics API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch lyrics' }, { status: 500 });
  }
}
