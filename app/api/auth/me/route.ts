// ============================================================
// SoundWave — Get Current User API Route
// ============================================================

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { withAuth, handleApiError, ApiError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const payload = await withAuth(req);

    const user = await User.findById(payload.userId)
      .select('-refreshTokens -__v')
      .lean();

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return Response.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
