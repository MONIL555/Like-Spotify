import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { searchLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';
import { searchYouTube } from '@/lib/youtube';
import SearchCache from '@/models/SearchCache';
import { SearchSchema } from '@/lib/validations';
import { z } from 'zod';

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
    });

    if (cachedResult) {
      return NextResponse.json(JSON.parse(cachedResult.results));
    }

    // 4. Fetch from YouTube API if not cached
    // Currently searchYouTube from lib/youtube only takes 'q' and maxResults
    // If type is specific, we might append it to the query, but 'all' just searches normally.
    const ytQuery = validated.type !== 'all' ? `${validated.q} ${validated.type}` : validated.q;
    
    // YouTube Data API has a max of 50 per request, we'll request 20 for standard searches
    const youtubeData = await searchYouTube(ytQuery, 20);

    // 5. Cache the result
    await SearchCache.create({
      query: validated.q,
      type: validated.type,
      results: JSON.stringify(youtubeData),
    });

    return NextResponse.json(youtubeData);

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).issues[0].message }, { status: 400 });
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
