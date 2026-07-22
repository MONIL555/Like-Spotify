import { NextRequest, NextResponse } from 'next/server';

// Optional: Edge runtime can handle long-running streams more efficiently
// However, since we are doing standard fetch streaming, it works fine in Node as well.
// We will use standard NextRequest/NextResponse.
export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': url.includes('pagalnew') ? 'https://pagalnew.com/' : 'https://pagalworld.is/'
    };

    const range = req.headers.get('range');
    if (range) {
      fetchHeaders['Range'] = range;
    }

    const response = await fetch(url, {
      headers: fetchHeaders,
      // Important to stream the body instead of downloading it fully into memory
      // We pass the signal to cancel the upstream fetch if the client disconnects
      signal: req.signal
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch external resource: ${response.statusText}` }, { status: response.status });
    }

    // Set up CORS headers so the Web Audio API can access the stream
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Range');
    headers.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range');

    // Strip restrictive headers that Google Drive sets which block <audio> tags
    headers.delete('cross-origin-resource-policy');
    headers.delete('cross-origin-embedder-policy');
    headers.delete('cross-origin-opener-policy');
    headers.delete('content-security-policy');
    headers.delete('x-content-security-policy');

    // Return the response body directly as a stream
    return new Response(response.body, {
      status: response.status,
      headers
    });
  } catch (error: any) {
    console.error('Stream Proxy Error:', error);
    return NextResponse.json({ error: 'Stream failed', details: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Range');
  return new NextResponse(null, { status: 204, headers });
}
