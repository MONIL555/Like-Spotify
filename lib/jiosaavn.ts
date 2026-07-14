import { Track } from '@/types';
import { formatDurationText } from './youtube';

const SAAVN_API_BASE = 'https://saavn.dev/api';

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

export async function searchSaavn(query: string, limit = 20): Promise<Track[]> {
  try {
    const res = await fetch(`${SAAVN_API_BASE}/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`JioSaavn API error: ${res.status}`);
    }

    const json = await res.json();
    if (!json.success || !json.data || !json.data.results) {
      return [];
    }

    return json.data.results.map((song: any) => {
      // Find the best quality image
      const highResImage = song.image?.find((img: any) => img.quality === '500x500')?.url || song.image?.[song.image.length - 1]?.url || '';
      const defaultImage = song.image?.[0]?.url || highResImage;

      // Extract artists
      const artists = song.primaryArtists ? song.primaryArtists.map((a: any) => decodeHTMLEntities(a.name)).join(', ') : 'Unknown Artist';

      // Find best quality audio stream
      const streamUrl = song.downloadUrl?.find((dl: any) => dl.quality === '320kbps')?.url || song.downloadUrl?.[song.downloadUrl.length - 1]?.url || '';

      return {
        videoId: `saavn_${song.id}`, // Fallback for components requiring a videoId structure
        saavnId: song.id,
        source: 'jiosaavn',
        streamUrl,
        title: decodeHTMLEntities(song.name),
        artist: artists,
        channelId: song.primaryArtists?.[0]?.id || 'unknown',
        channelTitle: artists,
        albumName: decodeHTMLEntities(song.album?.name || ''),
        thumbnails: {
          default: defaultImage,
          high: highResImage,
        },
        duration: song.duration || 0,
        durationText: formatDurationText(song.duration || 0),
        playCount: parseInt(song.playCount || '0', 10) || 0,
        likeCount: 0,
      } as Track;
    });
  } catch (error) {
    console.error('Error in searchSaavn:', error);
    throw error; // Throw so the caller can fallback
  }
}

export async function getSaavnTrackDetails(saavnId: string): Promise<Track | null> {
  try {
    const res = await fetch(`${SAAVN_API_BASE}/songs?id=${saavnId}`, {
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      throw new Error(`JioSaavn API error: ${res.status}`);
    }

    const json = await res.json();
    if (!json.success || !json.data || json.data.length === 0) {
      return null;
    }

    const song = json.data[0];
    
    // Find the best quality image
    const highResImage = song.image?.find((img: any) => img.quality === '500x500')?.url || song.image?.[song.image.length - 1]?.url || '';
    const defaultImage = song.image?.[0]?.url || highResImage;

    // Extract artists
    const artists = song.primaryArtists ? song.primaryArtists.map((a: any) => decodeHTMLEntities(a.name)).join(', ') : 'Unknown Artist';

    // Find best quality audio stream
    const streamUrl = song.downloadUrl?.find((dl: any) => dl.quality === '320kbps')?.url || song.downloadUrl?.[song.downloadUrl.length - 1]?.url || '';

    return {
      videoId: `saavn_${song.id}`,
      saavnId: song.id,
      source: 'jiosaavn',
      streamUrl,
      title: decodeHTMLEntities(song.name),
      artist: artists,
      channelId: song.primaryArtists?.[0]?.id || 'unknown',
      channelTitle: artists,
      albumName: decodeHTMLEntities(song.album?.name || ''),
      thumbnails: {
        default: defaultImage,
        high: highResImage,
      },
      duration: song.duration || 0,
      durationText: formatDurationText(song.duration || 0),
      playCount: parseInt(song.playCount || '0', 10) || 0,
      likeCount: 0,
    } as Track;
  } catch (error) {
    console.error('Error in getSaavnTrackDetails:', error);
    throw error;
  }
}
