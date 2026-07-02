import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';
import { apiLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';

// Use Node.js runtime since ytdl-core relies on Node modules (not edge compatible)
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);

    const videoId = req.nextUrl.searchParams.get('videoId');
    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Get video info to ensure it exists and get formats
    const info = await ytdl.getInfo(url);
    
    // Choose the best audio-only format
    const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly', quality: 'highestaudio' });
    
    if (!format || !format.url) {
      return NextResponse.json({ error: 'No audio format found' }, { status: 404 });
    }

    // Rather than streaming through our server (which times out after 10-60s on Vercel),
    // we redirect the client to the direct Google Video URL. This allows the native <audio> 
    // tag to stream directly from Google's servers, saving bandwidth and preventing timeouts.
    return NextResponse.redirect(format.url);

  } catch (error: any) {
    console.error('Stream API Error:', error);
    return NextResponse.json({ error: 'Failed to stream audio' }, { status: 500 });
  }
}
