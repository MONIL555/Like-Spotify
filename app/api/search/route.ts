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
    
    // Validate with Zod
    const validated = SearchSchema.parse({ q, type });

    // 3. Check Database Cache
    await connectDB();
    
    const cachedResult = await SearchCache.findOne({ 
      query: validated.q, 
      type: validated.type 
    }).lean();

    if (cachedResult) {
      return NextResponse.json(JSON.parse(cachedResult.results));
    }

    // 4. Try JioSaavn API First
    let searchData;
    let source = 'jiosaavn';
    try {
      // Saavn only supports basic query search, not specialized 'album' or 'artist' queries via this endpoint directly,
      // but we will use the general song search for all for now.
      const saavnTracks = await searchSaavn(validated.q, 20);
      
      if (saavnTracks.length === 0) {
        throw new Error('No results from JioSaavn');
      }

      searchData = {
        items: saavnTracks,
        nextPageToken: null,
        totalResults: saavnTracks.length,
      };
    } catch (error) {
      console.warn('JioSaavn search failed or returned 0 results, falling back to YouTube:', error);
      source = 'youtube';
      searchData = await searchYouTube(validated.q, 20, undefined, validated.type);
    }

    // 5. Cache the result
    await SearchCache.create({
      query: validated.q,
      type: validated.type,
      results: JSON.stringify(searchData),
    });

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
