import { NextRequest, NextResponse } from 'next/server';
import { searchSaavn } from '@/lib/jiosaavn';

// Expanded filter: catches jukebox, non-stop, medley, remix, lofi, slowed etc.
const COMPILATION_RE = /top\s*\d+|best of|mashup|jukebox|compilation|full album|audio jukebox|collection|playlist|medley|non[\s-]?stop|all songs|hit songs|evergreen/i;

// Filter out remix/lofi/slowed/cover variants of the original song
const VARIANT_RE = /\b(remix|lofi|lo[\s-]?fi|slowed|reverb|8d|3d|bass\s*boost(?:ed)?|karaoke|instrumental|cover|unplugged|acoustic\s*version|nightcore|sped\s*up|chipmunk)\b/i;

function isCompilation(title: string): boolean {
  return COMPILATION_RE.test(title);
}

function isVariant(title: string): boolean {
  return VARIANT_RE.test(title);
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

// We no longer need toTrack since searchSaavn already returns fully formed Track objects.

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');
    const artist  = searchParams.get('artist');
    const title   = searchParams.get('title') || '';
    const skipVideoIdsRaw = searchParams.get('skipVideoIds') || '';

    if (!videoId) {
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
    }

    const cleanArtist = cleanStr(artist ?? '');
    const cleanTitle = cleanStr(title);

    // Parse skip list (already-played tracks to exclude)
    const skipIds = new Set<string>(
      skipVideoIdsRaw ? skipVideoIdsRaw.split(',').filter(Boolean) : []
    );

    // ── DIVERSIFIED MIX ALGORITHM ───────────────────────────────
    // 5 diverse strategies to build a YouTube Music-style mix
    const currentYear = new Date().getFullYear();
    const queries = [
      cleanTitle ? `${cleanArtist} ${cleanTitle}` : cleanArtist,
      cleanArtist,
      `${cleanArtist} popular`,
      `${cleanArtist} hits`,
      `${cleanArtist} new`,
    ].filter(Boolean);

    const settled = await Promise.allSettled(
      queries.map(q => searchSaavn(q, 15))
    );

    const buckets: any[][] = settled.map(r =>
      r.status === 'fulfilled' ? (r.value ?? []) : []
    );

    const seenIds = new Set<string>([videoId, ...skipIds]);
    const seenTitlesTokens: Set<string>[] = [getTokens(title)];
    const channelCounts = new Map<string, number>();
    const mixTracks: any[] = [];
    const maxLen = Math.max(...buckets.map(b => b.length));

    // Round-robin pick from each bucket for diversity
    for (let i = 0; i < maxLen; i++) {
      for (const bucket of buckets) {
        const item = bucket[i];
        if (!item) continue;

        if (seenIds.has(item.videoId)) continue;
        if (isCompilation(item.title)) continue;
        if (isVariant(item.title)) continue;
        
        // Limit to max 2 tracks from the same channel/artist to ensure diverse mix
        const cName = (item.artist || item.channelTitle || '').toLowerCase();
        if ((channelCounts.get(cName) || 0) >= 2) continue;

        const tokens = getTokens(item.title);
        if (tokens.size === 0) continue;

        // Stricter dedup: lower threshold from 0.5 to 0.35 to catch more near-duplicates
        let isDuplicate = false;
        for (const seenTokens of seenTitlesTokens) {
          let intersection = 0;
          for (const t of tokens) {
            if (seenTokens.has(t)) intersection++;
          }
          const union = new Set([...tokens, ...seenTokens]).size;
          const similarity = intersection / union;
          
          if (similarity >= 0.25) {
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

    // Return up to 20 tracks for longer uninterrupted play
    const playlist = mixTracks.slice(0, 20);

    return NextResponse.json({
      playlist,           
      track: playlist[0], 
    });

  } catch (error: any) {
    console.error('Autoplay GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch autoplay track' }, { status: 500 });
  }
}
