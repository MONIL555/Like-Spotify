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

    if (!videoId) {
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
    }

    const cleanArtist = cleanStr(artist ?? '');

    // ── KEY FIX 1: Never include the song title ────────────────────────────
    // Including the title causes YouTube to return different uploads of the
    // exact same song (audio / lyrics / HD). These four queries give us:
    //   bucket 0 → same-artist catalog   (anchors the mix in familiar territory)
    //   bucket 1 → same-artist recents   (surfaces newer tracks)
    //   bucket 2 → similar artists       (the "discovery" layer)
    //   bucket 3 → collaborations / ft.  (bridges between artist worlds)
    const queries = [
      `${cleanArtist} songs`,
      `${cleanArtist} new songs`,
      `songs similar to ${cleanArtist}`,
      `${cleanArtist} collaborations ft`,
    ];

    // ── KEY FIX 2: Parallel fetches ────────────────────────────────────────
    const settled = await Promise.allSettled(
      queries.map(q => searchYouTube(q, 12))
    );

    const buckets: any[][] = settled.map(r =>
      r.status === 'fulfilled' ? (r.value?.items ?? []) : []
    );

    // ── KEY FIX 3: Interleave (round-robin) for variety ────────────────────
    // YouTube Mix alternates same-artist and related-artist tracks rather than
    // dumping all same-artist tracks first. Round-robin achieves that.
    const seen = new Set<string>([videoId]);
    const mixTracks: any[] = [];
    const maxLen = Math.max(...buckets.map(b => b.length));

    for (let i = 0; i < maxLen; i++) {
      for (const bucket of buckets) {
        const item = bucket[i];
        if (!item) continue;
        if (seen.has(item.videoId)) continue;
        if (isCompilation(item.title)) continue;
        seen.add(item.videoId);
        mixTracks.push(item);
      }
    }

    if (mixTracks.length === 0) {
      return NextResponse.json({ error: 'No similar tracks found' }, { status: 404 });
    }

    // ── KEY FIX 4: Return a full playlist, not just one track ──────────────
    const playlist = mixTracks.slice(0, 20).map(toTrack);

    return NextResponse.json({
      playlist,           // wire this to your player queue on the frontend
      track: playlist[0], // backward compat — the immediate next track
    });

  } catch (error: any) {
    console.error('Autoplay GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch autoplay track' }, { status: 500 });
  }
}
