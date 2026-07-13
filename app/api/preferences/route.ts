import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import { apiLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';
import UserPreferences from '@/models/UserPreferences';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);

    const token = req.cookies.get('access_token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const jwtUser = verifyAccessToken(token);

    await connectDB();
    
    let prefs = await UserPreferences.findOne({ userId: jwtUser.userId }).lean();
    
    if (!prefs) {
      prefs = await UserPreferences.create({ userId: jwtUser.userId });
    }

    return NextResponse.json(prefs);

  } catch (error: any) {
    console.error('Preferences GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);

    const token = req.cookies.get('access_token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const jwtUser = verifyAccessToken(token);

    const updates = await req.json();

    await connectDB();
    
    const prefs = await UserPreferences.findOneAndUpdate(
      { userId: jwtUser.userId },
      { $set: updates },
      { new: true, upsert: true }
    );

    return NextResponse.json(prefs);

  } catch (error: any) {
    console.error('Preferences PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
