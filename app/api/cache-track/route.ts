import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CachedTrack from '@/models/CachedTrack';
import { searchPagalWorld, scrapeSongPage, cacheSongAudio } from '@/lib/pagalworld';
import { searchPagalNew, scrapePagalNewSongPage, cachePagalNewSongAudio } from '@/lib/pagalnew';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const videoId = url.searchParams.get('videoId');
    if (!videoId) return NextResponse.json({ status: 'not_found' }, { status: 400 });
    
    await connectDB();
    const cachedTrack = await CachedTrack.findOne({ videoId, status: 'ready' }).lean();
    if (cachedTrack) {
      return NextResponse.json({ status: 'ready', track: cachedTrack });
    }
    return NextResponse.json({ status: 'not_found' });
  } catch (error) {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { videoId, title, artist, userId } = await req.json();

    if (!videoId || !title || !artist) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    // 1. Deduplication check: is it already cached or processing?
    let cachedTrack = await CachedTrack.findOne({ videoId });
    if (cachedTrack) {
      if (cachedTrack.status === 'ready' || cachedTrack.status === 'processing') {
        return NextResponse.json({ 
          status: cachedTrack.status, 
          audioUrl: cachedTrack.audioUrl 
        });
      }
      // If status is 'failed', we will retry the caching process.
      // Update status to processing
      cachedTrack.status = 'processing';
      await cachedTrack.save();
    } else {
      // Create a pending record
      cachedTrack = new CachedTrack({
        videoId,
        title,
        artist,
        cachedBy: userId || 'anonymous',
        status: 'processing'
      });
      await cachedTrack.save();
    }



    // 2. Search PagalWorld
    // We clean the title to get better search results (remove "Lyrical Video", "Official Video", etc)
    const cleanTitle = title
      .replace(/\(.*?\)|\[.*?\]|Lyrical|Official|Video|Audio|Full Song|HD/gi, '')
    let cleanArtist = artist.replace(/- Topic/i, '').replace(/VEVO/i, '').trim();
    const query = `${cleanTitle} ${cleanArtist}`.trim();
    
    console.log(`[Cache Track] Searching PagalWorld for: ${query}`);
    let searchResults = await searchPagalWorld(query);
    
    // Fallback 1: Try PagalWorld with just the title
    if (searchResults.length === 0) {
      console.log(`[Cache Track] Not found on PagalWorld with artist, trying title only: ${cleanTitle}`);
      searchResults = await searchPagalWorld(cleanTitle);
    }
    
    if (searchResults.length === 0) {
      // Fallback 2: Try PagalNew with title + artist
      console.log(`[Cache Track] Not found on PagalWorld, trying PagalNew for: ${query}`);
      const pagalNewResults = await searchPagalNew(query);
      let finalPagalNewResults = pagalNewResults;
      
      // Fallback 3: Try PagalNew with title only
      if (finalPagalNewResults.length === 0) {
        console.log(`[Cache Track] Not found on PagalNew with artist, trying title only: ${cleanTitle}`);
        finalPagalNewResults = await searchPagalNew(cleanTitle);
      }
      
      if (finalPagalNewResults.length === 0) {
        cachedTrack.status = 'failed';
        await cachedTrack.save();
        return NextResponse.json({ error: 'Song not found on PagalWorld or PagalNew' }, { status: 404 });
      }
      
      // Found on PagalNew
      const bestMatch = finalPagalNewResults[0];
      const songDetails = await scrapePagalNewSongPage(bestMatch.url);
      
      if (!songDetails) {
        cachedTrack.status = 'failed';
        await cachedTrack.save();
        return NextResponse.json({ error: 'Failed to scrape PagalNew song details' }, { status: 500 });
      }
      
      try {
        const audioInfo = await cachePagalNewSongAudio(songDetails, videoId);
        
        cachedTrack.status = 'ready';
        cachedTrack.audioUrl = audioInfo.url;
        cachedTrack.audioFormat = audioInfo.format;
        cachedTrack.audioBitrate = audioInfo.bitrate;
        cachedTrack.audioSize = audioInfo.size;
        cachedTrack.albumName = songDetails.album;
        cachedTrack.source = 'pagalnew_cached';
        cachedTrack.pagalworldSlug = bestMatch.slug;
        
        if (songDetails.coverUrl) {
          cachedTrack.thumbnails = {
            default: { url: songDetails.coverUrl, width: 150, height: 150 },
            high: { url: songDetails.coverUrl, width: 500, height: 500 }
          };
        }
        
        await cachedTrack.save();
        return NextResponse.json({ status: 'ready', audioUrl: cachedTrack.audioUrl, message: 'Song cached via PagalNew' });
      } catch (err) {
        console.error('Failed to cache audio from PagalNew:', err);
        cachedTrack.status = 'failed';
        await cachedTrack.save();
        return NextResponse.json({ 
          error: 'Failed to download from PagalNew', 
          details: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined
        }, { status: 500 });
      }
    }

    // Found on PagalWorld
    const bestMatch = searchResults[0];

    // 3. Scrape song details
    const songDetails = await scrapeSongPage(bestMatch.url);
    if (!songDetails) {
      cachedTrack.status = 'failed';
      await cachedTrack.save();
      return NextResponse.json({ error: 'Failed to scrape song details' }, { status: 500 });
    }

    // 4. Download and cache to Firebase
    try {
      const audioInfo = await cacheSongAudio(songDetails, videoId);
      
      // 5. Update the CachedTrack with success
      cachedTrack.status = 'ready';
      cachedTrack.audioUrl = audioInfo.url;
      cachedTrack.audioFormat = audioInfo.format;
      cachedTrack.audioBitrate = audioInfo.bitrate;
      cachedTrack.audioSize = audioInfo.size;
      
      cachedTrack.albumName = songDetails.album;
      cachedTrack.pagalworldSlug = bestMatch.slug;
      cachedTrack.source = 'pagalworld_cached';
      
      // Save high res thumbnail from scrape if available
      if (songDetails.coverUrl) {
        cachedTrack.thumbnails = {
          default: { url: songDetails.coverUrl, width: 150, height: 150 },
          high: { url: songDetails.coverUrl, width: 500, height: 500 }
        };
      }
      
      await cachedTrack.save();

      return NextResponse.json({ 
        status: 'ready', 
        audioUrl: cachedTrack.audioUrl,
        message: 'Song cached successfully'
      });
      
    } catch (err) {
      console.error('Failed to cache audio:', err);
      cachedTrack.status = 'failed';
      await cachedTrack.save();
      return NextResponse.json({ error: 'Failed to download and store audio' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in cache-track API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
