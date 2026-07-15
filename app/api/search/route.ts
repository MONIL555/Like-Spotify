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
      
      return NextResponse.json({ ...searchData, source: 'youtube' });
    }

    // 3. Check Database Cache
    await connectDB();
    
    const cachedResult = await SearchCache.findOne({ 
      query: validated.q, 
      type: validated.type 
    }).lean();

    if (cachedResult && JSON.parse(cachedResult.results).items?.length > 0) {
      return NextResponse.json(JSON.parse(cachedResult.results));
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
    } catch (error) {
      // Check YouTube fallback flag before falling back
      let youtubeAllowed = true;
      try {
        const AppConfig = (await import('@/models/AppConfig')).default;
        const config = await AppConfig.findById('global_config');
        if (config && config.youtubeFallbackEnabled === false) {
          youtubeAllowed = false;
        }
      } catch { /* ignore config check failure */ }

      if (youtubeAllowed) {
        console.warn('JioSaavn search failed, falling back to YouTube:', error);
        source = 'youtube';
        searchData = await searchYouTube(validated.q, 20, undefined, validated.type);
        
        if (validated.type === 'video' && searchData.items && searchData.items.length > 0) {
          searchData.items.sort((a: any, b: any) => {
            const aIsOfficial = a.channelName?.toLowerCase().includes('topic') || a.channelName?.toLowerCase().includes('vevo') ? 1 : 0;
            const bIsOfficial = b.channelName?.toLowerCase().includes('topic') || b.channelName?.toLowerCase().includes('vevo') ? 1 : 0;
            return bIsOfficial - aIsOfficial;
          });
          searchData.items = searchData.items.slice(0, validated.limit);
        }
      } else {
        console.warn('JioSaavn search failed, YouTube fallback is disabled');
        searchData = {
          items: [],
          nextPageToken: null,
          totalResults: 0,
        };
      }
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
