// ============================================================
// MoniStream — Token Refresh API Route
// ============================================================

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyRefreshToken, signAccessToken, handleApiError, ApiError, getAuthCookieOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const refreshToken = req.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      throw new ApiError(401, 'Refresh token not found');
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if refresh token exists in DB (not revoked)
    const user = await User.findOne({
      _id: payload.userId,
      'refreshTokens.token': refreshToken,
    });

    if (!user) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    // Generate new access token
    const accessToken = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      plan: user.plan,
    });

    // Build response with new access token cookie
    const response = Response.json({
      success: true,
      data: { accessToken },
    });

    const headers = new Headers(response.headers);
    const accessCookie = getAuthCookieOptions(false);

    headers.append(
      'Set-Cookie',
      `access_token=${accessToken}; HttpOnly; Path=${accessCookie.path}; Max-Age=${accessCookie.maxAge}; SameSite=${accessCookie.sameSite}${accessCookie.secure ? '; Secure' : ''}`
    );

    return new Response(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
