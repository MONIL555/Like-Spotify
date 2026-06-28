// ============================================================
// SpotTunes — Logout API Route
// ============================================================

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { withAuth, handleApiError } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const payload = await withAuth(req);

    // Remove the refresh token from DB
    const refreshToken = req.cookies.get('refresh_token')?.value;
    if (refreshToken) {
      await User.findByIdAndUpdate(payload.userId, {
        $pull: { refreshTokens: { token: refreshToken } },
      });
    }

    // Clear cookies
    const headers = new Headers();
    headers.append(
      'Set-Cookie',
      'access_token=; HttpOnly; Path=/; Max-Age=0; SameSite=lax'
    );
    headers.append(
      'Set-Cookie',
      'refresh_token=; HttpOnly; Path=/; Max-Age=0; SameSite=lax'
    );

    return new Response(
      JSON.stringify({ success: true, message: 'Logged out successfully' }),
      {
        status: 200,
        headers,
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
