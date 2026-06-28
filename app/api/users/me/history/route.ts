import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import { apiLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';
import ListeningHistory from '@/models/ListeningHistory';

export async function DELETE(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);

    const token = req.cookies.get('access_token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const jwtUser = verifyAccessToken(token);

    await connectDB();
    
    // Clear all history for the user
    await ListeningHistory.deleteMany({ userId: jwtUser.userId });

    return NextResponse.json({ success: true, message: 'Listening history cleared' });

  } catch (error: any) {
    console.error('History DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to clear history' }, { status: 500 });
  }
}
