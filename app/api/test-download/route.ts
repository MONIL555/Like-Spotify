import { NextResponse } from 'next/server';

export async function GET() {
  const url = 'https://128.pagalnew.com/download-128k.php?id=9145';
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json({ error: `Failed: ${response.statusText}` });
    }
    const buffer = await response.arrayBuffer();
    return NextResponse.json({ success: true, size: buffer.byteLength });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
