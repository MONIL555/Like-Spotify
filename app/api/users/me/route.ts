import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import { apiLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';
import User from '@/models/User';

export async function PUT(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);

    const token = req.cookies.get('access_token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const jwtUser = verifyAccessToken(token);

    const body = await req.json();
    const { displayName, email, avatarUrl } = body;

    await connectDB();
    
    // Check if email is being changed and if it already exists
    if (email) {
      const existingEmailUser = await User.findOne({ email, _id: { $ne: jwtUser.userId } }).lean();
      if (existingEmailUser) {
        return NextResponse.json({ error: 'Email is already in use' }, { status: 400 });
      }
    }

    const updates: any = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (email !== undefined) updates.email = email;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

    const user = await User.findByIdAndUpdate(
      jwtUser.userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      avatarColor: user.avatarColor,
      plan: user.plan,
    });

  } catch (error: any) {
    console.error('User PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
