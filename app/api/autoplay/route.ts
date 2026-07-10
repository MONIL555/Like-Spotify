import { NextRequest, NextResponse } from 'next/server';
import { searchYouTube } from '@/lib/youtube';

// Expanded filter: catches jukebox, non-stop, medley etc.
const COMPILATION_RE = /top\s*\d+|best of|mashup|jukebox|compilation|full album|audio jukebox|collection|playlist|medley|non[\s-]?stop|all songs|hit songs|evergreen/i;

function isCompilation(title: string): boolean {
  return COMPILATION_RE.test(title);
}

// Strip trailing noise from artist/channel names: "(Official)", "- Topic", etc.
function cleanStr(str: string): string {
  return (str ?? '')
    .replace(/\s*[\-–|]\s*(Topic|VEVO|Official|Music).*$/i, '')
    .replace(/\s*[\(\[].+?[\)\]]/g, '')
    .trim();
}

// Extract the base core of a title to detect exact same songs
// e.g. "Song (Official Video)" and "Song Lyrical" both become "song"
function getBaseTitle(title: string): string {
  let base = title.toLowerCase();
  base = base.split(/[\-–|]/)[0]; // Real title is usually before the first dash
  base = base.replace(/\s*[\(\[].+?[\)\]]/g, '');
  base = base.replace(/\b(official|video|audio|lyrical|lyric|full|song|hd|4k|remix|mashup)\b/gi, '');
  return base.replace(/[^a-z0-9]/g, '');
}

function toTrack(item: any) {
  return {
    id: item.videoId,
    videoId: item.videoId,
    title: item.title,
    artist: item.channelName,
    albumName: 'Auto Mix',
    thumbnails: {
      default: item.thumbnail,
      high: item.thumbnail,
    },
    duration: 0,
    type: 'track',
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');
    const artist  = searchParams.get('artist');
    const title   = searchParams.get('title') || '';

    if (!videoId) {
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
    }

    const cleanArtist = cleanStr(artist ?? '');
    const cleanTitle = cleanStr(title);

    // ── FALLBACK ALGORITHM (Since relatedToVideoId is deprecated) ────────────
    // Because YouTube deprecated the 'relatedToVideoId' endpoint in August 2023,
    // we cannot use it directly. To simulate a YouTube Mix and capture the mood/vibe,
    // we query YouTube with natural language searches that emulate related tracks.
    // 
    // bucket 0 → "songs like [Title] by [Artist]" (Captures the specific mood)
    // bucket 1 → "[Artist] best songs" (Familiar hits)
    // bucket 2 → "songs similar to [Artist]" (Discovery/Similar artists)
    // bucket 3 → "[Artist] new songs" (Recent catalog)
    const queries = [
      `songs like ${cleanTitle} by ${cleanArtist}`,
      `${cleanArtist} best songs`,
      `songs similar to ${cleanArtist}`,
      `${cleanArtist} new songs`,
    ];

    const settled = await Promise.allSettled(
      queries.map(q => searchYouTube(q, 10))
    );

    const buckets: any[][] = settled.map(r =>
      r.status === 'fulfilled' ? (r.value?.items ?? []) : []
    );

    // Round-robin interleave to weave the mood and artists together
    const seenIds = new Set<string>([videoId]);
    const seenTitles = new Set<string>([getBaseTitle(cleanTitle)]);
    const mixTracks: any[] = [];
    const maxLen = Math.max(...buckets.map(b => b.length));

    for (let i = 0; i < maxLen; i++) {
      for (const bucket of buckets) {
        const item = bucket[i];
        if (!item) continue;

        const baseTitle = getBaseTitle(item.title);

        if (seenIds.has(item.videoId)) continue;
        if (seenTitles.has(baseTitle) && baseTitle.length > 2) continue; // Skip same songs!
        if (isCompilation(item.title)) continue;

        seenIds.add(item.videoId);
        seenTitles.add(baseTitle);
        mixTracks.push(item);
      }
    }

    if (mixTracks.length === 0) {
      return NextResponse.json({ error: 'No similar tracks found' }, { status: 404 });
    }

    const playlist = mixTracks.slice(0, 8).map(toTrack);

    return NextResponse.json({
      playlist,           
      track: playlist[0], 
    });

  } catch (error: any) {
    console.error('Autoplay GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch autoplay track' }, { status: 500 });
  }
}
