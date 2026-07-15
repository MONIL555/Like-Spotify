import { Track } from '@/types';
import { formatDurationText } from './youtube';

const SAAVN_API_BASE = 'https://saavn-api.vercel.app';

// Utility to decode HTML entities
function decodeHTMLEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function mapNewSaavnTrack(song: any): Track {
  return {
    videoId: `saavn_${song.id}`,
    saavnId: song.id,
    source: 'jiosaavn',
    streamUrl: song.url || '',
    title: decodeHTMLEntities(song.title || ''),
    artist: decodeHTMLEntities(song.artists || 'Unknown Artist'),
    channelId: song.album_id || 'unknown',
    channelTitle: decodeHTMLEntities(song.album_artist || song.artists || 'Unknown Artist'),
    albumName: decodeHTMLEntities(song.album || ''),
    thumbnails: {
      default: song.image || '',
      high: song.image || '',
    },
    duration: parseInt(song.duration || '0', 10),
    durationText: formatDurationText(parseInt(song.duration || '0', 10)),
    playCount: parseInt(song.play_count || '0', 10),
    likeCount: 0,
  };
}

export async function searchSaavn(query: string, limit = 20): Promise<Track[]> {
  try {
    const res = await fetch(`${SAAVN_API_BASE}/search/${encodeURIComponent(query)}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`JioSaavn API error: ${res.status}`);
    }

    const json = await res.json();
    
    // The new API returns an array directly
    if (!Array.isArray(json)) {
      return [];
    }

    // Limit results manually since API doesn't seem to support limit param
    return json.slice(0, limit).map((song: any) => mapNewSaavnTrack(song));
  } catch (error) {
    console.error('============================');
    console.error('Error in searchSaavn:');
    console.error(error);
    if (error instanceof Error && error.cause) {
      console.error('Cause:', error.cause);
    }
    console.error('============================');
    throw error; // Throw so the caller can fallback
  }
}

export async function getSaavnTrackDetails(saavnId: string): Promise<Track | null> {
  try {
    const res = await fetch(`${SAAVN_API_BASE}/song/${saavnId}`, {
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      throw new Error(`JioSaavn API error: ${res.status}`);
    }

    const song = await res.json();
    
    if (!song || song.detail === 'Not Found' || !song.id) {
      return null;
    }

    return mapNewSaavnTrack(song);
  } catch (error) {
    console.error('Error in getSaavnTrackDetails:', error);
    throw error;
  }
}
