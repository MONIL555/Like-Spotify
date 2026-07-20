import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { searchLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';
import { searchYouTube } from '@/lib/youtube';
import { searchSaavn } from '@/lib/jiosaavn';
import SearchCache from '@/models/SearchCache';
import { SearchSchema } from '@/lib/validations';
import { ZodError } from 'zod';

export async function GET(req: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = getClientIp(req);
    await checkRateLimit(searchLimiter, ip);

    // 2. Parse Query Parameters
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || '';
    const type = url.searchParams.get('type') || 'all';
    const limitParam = url.searchParams.get('limit');
    const sourceParam = url.searchParams.get('source');
    
    // Validate with Zod
    const validated = SearchSchema.parse({ 
      q, 
      type, 
      ...(limitParam && { limit: limitParam }), 
      ...(sourceParam && { source: sourceParam }) 
    });

    // Step 2.5: Fetch from CachedTrack (PagalWorld/PagalNew cached tracks)
    const CachedTrack = (await import('@/models/CachedTrack')).default;
    let localCachedTracks: any[] = [];
    if (validated.type === 'video' || validated.type === 'all' || !validated.type) {
      await connectDB();
      const dbCachedTracks = await CachedTrack.find(
        { $text: { $search: validated.q }, status: 'ready' },
        { score: { $meta: 'textScore' } }
      ).sort({ score: { $meta: 'textScore' } }).limit(5).lean();

      localCachedTracks = dbCachedTracks.map((ct: any) => ({
        videoId: ct.videoId,
        title: ct.title,
        artist: ct.artist,
        channelTitle: ct.channelTitle,
        channelId: ct.channelId,
        thumbnails: ct.thumbnails,
        duration: ct.duration,
        durationText: ct.durationText,
        source: 'pagalworld_cached',
        audioUrl: ct.audioUrl,
      }));
    }

    if (validated.source === 'youtube') {
      const fetchLimit = validated.type === 'video' ? 10 : validated.limit;
      const searchData = await searchYouTube(validated.q, fetchLimit, undefined, validated.type);
      
      if (validated.type === 'video' && searchData.items && searchData.items.length > 0) {
        // Sort to prioritize official channels ("Topic" or "VEVO")
        searchData.items.sort((a: any, b: any) => {
          const aIsOfficial = a.channelName?.toLowerCase().includes('topic') || a.channelName?.toLowerCase().includes('vevo') ? 1 : 0;
          const bIsOfficial = b.channelName?.toLowerCase().includes('topic') || b.channelName?.toLowerCase().includes('vevo') ? 1 : 0;
          return bIsOfficial - aIsOfficial;
        });
        
        // Slice down to requested limit
        searchData.items = searchData.items.slice(0, validated.limit);
      }

      // Deduplicate and prepend
      const localIds = new Set(localCachedTracks.map(t => t.videoId));
      if (searchData.items) {
        searchData.items = searchData.items.filter((item: any) => !localIds.has(item.videoId));
        searchData.items = [...localCachedTracks, ...searchData.items];
      }
      
      return NextResponse.json({ ...searchData, source: 'youtube' });
    }

    // 3. Check Database Cache
    await connectDB();
    
    const searchCacheResult = await SearchCache.findOne({ 
      query: validated.q, 
      type: validated.type 
    }).lean();

    if (searchCacheResult && JSON.parse(searchCacheResult.results).items?.length > 0) {
      const parsedResults = JSON.parse(searchCacheResult.results);
      
      if (parsedResults.source !== 'youtube') {
        // Prepend local tracks if not present
        const localIds = new Set(localCachedTracks.map(t => t.videoId));
        parsedResults.items = parsedResults.items.filter((item: any) => !localIds.has(item.videoId || item.id));
        parsedResults.items = [...localCachedTracks, ...parsedResults.items];
        
        return NextResponse.json(parsedResults);
      }
    }

    // 4. Try JioSaavn API First
    let searchData;
    let source = 'jiosaavn';
    try {
      if (validated.type === 'channel') {
        throw new Error('JioSaavn does not support artist/channel search directly in this wrapper');
      }

      // Saavn only supports basic query search, not specialized 'album' or 'artist' queries via this endpoint directly,
      // but we will use the general song search for all for now.
      const saavnTracks = await searchSaavn(validated.q, validated.limit);
      
      if (saavnTracks.length === 0) {
        throw new Error('No results from JioSaavn');
      }

      searchData = {
        items: saavnTracks,
        nextPageToken: null,
        totalResults: saavnTracks.length,
      };
      
      // Deduplicate and prepend cached tracks
      const localIds = new Set(localCachedTracks.map(t => t.videoId));
      searchData.items = searchData.items.filter((item: any) => !localIds.has(item.videoId || item.id));
      searchData.items = [...localCachedTracks, ...searchData.items];
    } catch (error) {
      console.warn('JioSaavn search failed:', error);
      searchData = {
        items: [],
        nextPageToken: null,
        totalResults: 0,
      };
    }

    // 5. Cache the result (Upsert to replace bad cache)
    await SearchCache.findOneAndUpdate(
      { query: validated.q, type: validated.type },
      { results: JSON.stringify({ ...searchData, source }) },
      { upsert: true, new: true }
    );


    return NextResponse.json({ ...searchData, source });

  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    
    if (error.statusCode === 429) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    console.error('Search API Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the search.' },
      { status: 500 }
    );
  }
}
