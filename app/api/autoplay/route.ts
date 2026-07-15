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

function getTokens(title: string): Set<string> {
  let base = title.toLowerCase();
  // Remove content in brackets/parentheses
  base = base.replace(/\s*[\(\[].+?[\)\]]/g, '');
  // Remove known noise words
  base = base.replace(/\b(official|video|audio|lyrical|lyric|full|song|hd|4k|remix|mashup|mix|beat|lofi|slowed|reverb|instrumental|cover|karaoke|live|studio|feat|ft|featuring|version|edit|tiktok|viral|trend|bass|boosted|chill|vibes|music|bgm|trap|dj|8d|3d)\b/gi, '');
  // Split by non-alphanumeric and filter small words
  return new Set(base.split(/[^a-z0-9]+/).filter(t => t.length > 2));
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
    const queries = [
      `${cleanTitle} ${cleanArtist} similar vibe songs`,
      `trending hits like ${cleanTitle}`,
      `popular songs radio mix ${cleanArtist}`,
      `top tracks same genre as ${cleanTitle}`,
    ];

    const settled = await Promise.allSettled(
      queries.map(q => searchYouTube(q, 10))
    );

    const buckets: any[][] = settled.map(r =>
      r.status === 'fulfilled' ? (r.value?.items ?? []) : []
    );

    const seenIds = new Set<string>([videoId]);
    const seenTitlesTokens: Set<string>[] = [getTokens(title)];
    const channelCounts = new Map<string, number>();
    const mixTracks: any[] = [];
    const maxLen = Math.max(...buckets.map(b => b.length));

    for (let i = 0; i < maxLen; i++) {
      for (const bucket of buckets) {
        const item = bucket[i];
        if (!item) continue;

        if (seenIds.has(item.videoId)) continue;
        if (isCompilation(item.title)) continue;
        
        // Limit to max 2 tracks from the same channel/artist to ensure a varied vibe
        const cName = item.channelName?.toLowerCase() || '';
        if ((channelCounts.get(cName) || 0) >= 2) continue;

        const tokens = getTokens(item.title);
        if (tokens.size === 0) continue;

        let isDuplicate = false;
        for (const seenTokens of seenTitlesTokens) {
          let intersection = 0;
          for (const t of tokens) {
            if (seenTokens.has(t)) intersection++;
          }
          const union = new Set([...tokens, ...seenTokens]).size;
          const similarity = intersection / union;
          
          if (similarity >= 0.5) {
            isDuplicate = true;
            break;
          }
        }

        if (isDuplicate) continue;

        seenIds.add(item.videoId);
        seenTitlesTokens.push(tokens);
        if (cName) {
          channelCounts.set(cName, (channelCounts.get(cName) || 0) + 1);
        }
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
