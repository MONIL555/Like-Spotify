// ============================================================
// SpotTunes — Get Current User API Route
// ============================================================

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { withAuth, handleApiError, ApiError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const payload = await withAuth(req);

    if (payload.role === 'admin') {
      return Response.json({
        success: true,
        data: {
          user: {
            _id: 'admin',
            email: payload.email,
            username: 'admin',
            displayName: 'Administrator',
            avatarUrl: null,
            avatarColor: '#1DB954',
            plan: 'premium',
            role: 'admin',
            followers: [],
            following: [],
            likedTrackIds: [],
            savedAlbumIds: [],
            followedArtistIds: [],
          }
        },
      });
    }

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
