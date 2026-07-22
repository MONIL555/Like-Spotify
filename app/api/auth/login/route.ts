// ============================================================
// MoniStream — Login API Route
// ============================================================

import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { LoginSchema } from '@/lib/validations';
import { signAccessToken, signRefreshToken, handleApiError, ApiError, getAuthCookieOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const validated = LoginSchema.safeParse(body);

    if (!validated.success) {
      return Response.json(
        {
          success: false,
          error: 'Validation failed',
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;

    // Check for admin login
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
      const tokenPayload = {
        userId: 'admin',
        email: adminEmail,
        role: 'admin' as const,
      };

      const accessToken = signAccessToken(tokenPayload);
      const refreshToken = signRefreshToken(tokenPayload);

      const response = Response.json({
        success: true,
        data: {
          user: {
            _id: 'admin',
            email: adminEmail,
            username: 'admin',
            displayName: 'Administrator',
            avatarUrl: null,
            avatarColor: '#1DB954',
            role: 'admin',
            followers: [],
            following: [],
            likedTrackIds: [],
            savedAlbumIds: [],
            followedArtistIds: [],
          },
        },
      });

      const headers = new Headers(response.headers);
      const accessCookie = getAuthCookieOptions(false);
      const refreshCookie = getAuthCookieOptions(true);

      headers.append(
        'Set-Cookie',
        `access_token=${accessToken}; HttpOnly; Path=${accessCookie.path}; Max-Age=${accessCookie.maxAge}; SameSite=${accessCookie.sameSite}${accessCookie.secure ? '; Secure' : ''}`
      );
      headers.append(
        'Set-Cookie',
        `refresh_token=${refreshToken}; HttpOnly; Path=${refreshCookie.path}; Max-Age=${refreshCookie.maxAge}; SameSite=${refreshCookie.sameSite}${refreshCookie.secure ? '; Secure' : ''}`
      );

      return new Response(response.body, { status: 200, headers });
    }

    // Find user with password field
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account has been deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Generate tokens
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: (user as any).role || 'user',
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // Store refresh token (keep last 5 sessions)
    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 30);

    // Remove expired tokens and keep last 5
    await User.findByIdAndUpdate(user._id, {
      $push: {
        refreshTokens: {
          $each: [{
            token: refreshToken,
            createdAt: new Date(),
            expiresAt: refreshExpiry,
          }],
          $slice: -5, // Keep only last 5 refresh tokens
        },
      },
    });

    // Build response
    const response = Response.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          avatarColor: user.avatarColor,
          role: (user as any).role || 'user',
          followers: user.followers,
          following: user.following,
          likedTrackIds: user.likedTrackIds,
          savedAlbumIds: user.savedAlbumIds,
          followedArtistIds: user.followedArtistIds,
        },
      },
    });

    // Set cookies
    const headers = new Headers(response.headers);
    const accessCookie = getAuthCookieOptions(false);
    const refreshCookie = getAuthCookieOptions(true);

    headers.append(
      'Set-Cookie',
      `access_token=${accessToken}; HttpOnly; Path=${accessCookie.path}; Max-Age=${accessCookie.maxAge}; SameSite=${accessCookie.sameSite}${accessCookie.secure ? '; Secure' : ''}`
    );
    headers.append(
      'Set-Cookie',
      `refresh_token=${refreshToken}; HttpOnly; Path=${refreshCookie.path}; Max-Age=${refreshCookie.maxAge}; SameSite=${refreshCookie.sameSite}${refreshCookie.secure ? '; Secure' : ''}`
    );

    return new Response(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
