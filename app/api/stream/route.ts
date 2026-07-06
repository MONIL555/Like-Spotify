// ============================================================
// SpotTunes — Audio Stream Proxy API
// ============================================================
// Proxies YouTube audio through our own server so the browser's
// <audio> element sees a same-origin URL. This eliminates all
// CORS issues and supports Range requests for seeking.
//
// Flow:
//   1. Client:  <audio src="/api/stream?videoId=xxx">
//   2. Server:  Extract direct URL via ytdl-core (cached 3h)
//   3. Server:  Proxy the audio bytes from YouTube → Client
//   4. Client:  Plays natively with full background support
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';

// ─── Stream URL Cache ───────────────────────────────────────
const CACHE_TTL = 3 * 60 * 60 * 1000; // 3 hours
const MAX_CACHE = 200;

interface CachedStream {
  url: string;
  contentType: string;
  expiry: number;
}

const cache = new Map<string, CachedStream>();

function pruneCache() {
  if (cache.size <= MAX_CACHE) return;
  const now = Date.now();
  for (const [key, val] of cache) {
    if (val.expiry < now) cache.delete(key);
  }
  if (cache.size > MAX_CACHE) {
    const sorted = [...cache.entries()].sort((a, b) => a[1].expiry - b[1].expiry);
    for (const [key] of sorted.slice(0, sorted.length - MAX_CACHE)) {
      cache.delete(key);
    }
  }
}

async function extractStreamUrl(videoId: string): Promise<CachedStream> {
  const info = await ytdl.getInfo(videoId, {
    requestOptions: {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    },
  });

  const formats = ytdl
    .filterFormats(info.formats, 'audioonly')
    .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));

  if (formats.length === 0) {
    throw new Error('No audio-only format found');
  }

  // Prefer high-quality audio; prefer mp4/m4a for widest browser compatibility
  const format =
    formats.find((f) => f.container === 'mp4' && (f.audioBitrate || 0) >= 128) ||
    formats.find((f) => f.container === 'webm' && (f.audioBitrate || 0) >= 128) ||
    formats[0];

  if (!format?.url) throw new Error('No stream URL in format');

  const entry: CachedStream = {
    url: format.url,
    contentType: format.mimeType || `audio/${format.container}`,
    expiry: Date.now() + CACHE_TTL,
  };

  cache.set(videoId, entry);
  pruneCache();

  return entry;
}

async function getStreamUrl(videoId: string): Promise<CachedStream> {
  const cached = cache.get(videoId);
  if (cached && cached.expiry > Date.now()) return cached;
  return extractStreamUrl(videoId);
}

// ─── GET /api/stream?videoId=xxx ────────────────────────────

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('videoId');

  if (!videoId || videoId.length < 11) {
    return NextResponse.json({ error: 'Invalid videoId' }, { status: 400 });
  }

  try {
    let stream = await getStreamUrl(videoId);

    // ── Build proxy request headers ──
    const proxyHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    };

    // Forward Range header for seeking support
    const range = request.headers.get('range');
    if (range) {
      proxyHeaders['Range'] = range;
    }

    // ── Fetch from YouTube ──
    let ytRes = await fetch(stream.url, {
      headers: proxyHeaders,
      redirect: 'follow',
    });

    // If expired (403), re-extract and retry once
    if (ytRes.status === 403) {
      console.log(`[Stream Proxy] URL expired for ${videoId}, re-extracting...`);
      cache.delete(videoId);
      stream = await extractStreamUrl(videoId);
      ytRes = await fetch(stream.url, {
        headers: proxyHeaders,
        redirect: 'follow',
      });
    }

    if (!ytRes.ok && ytRes.status !== 206) {
      throw new Error(`YouTube returned HTTP ${ytRes.status}`);
    }

    // ── Build response headers ──
    const resHeaders = new Headers();
    resHeaders.set('Content-Type', stream.contentType);
    resHeaders.set('Accept-Ranges', 'bytes');
    resHeaders.set('Cache-Control', 'no-store'); // Don't cache proxied audio

    const cl = ytRes.headers.get('content-length');
    if (cl) resHeaders.set('Content-Length', cl);

    const cr = ytRes.headers.get('content-range');
    if (cr) resHeaders.set('Content-Range', cr);

    // ── Stream the response body ──
    return new Response(ytRes.body, {
      status: ytRes.status, // 200 for full, 206 for range
      headers: resHeaders,
    });
  } catch (error: any) {
    console.error(`[Stream Proxy] Failed for ${videoId}:`, error.message);
    // Return a non-audio error so the <audio> element fires onerror
    return NextResponse.json(
      { error: 'Stream proxy failed', message: error.message },
      { status: 500 }
    );
  }
}
