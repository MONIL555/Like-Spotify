// ============================================================
// SpotTunes — Register API Route
// ============================================================

import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import UserPreferences from '@/models/UserPreferences';
import { RegisterSchema } from '@/lib/validations';
import { signAccessToken, signRefreshToken, handleApiError, ApiError, getAuthCookieOptions } from '@/lib/auth';
import { generateAvatarColor } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const validated = RegisterSchema.safeParse(body);

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

    const { email, username, displayName, password } = validated.data;

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      throw new ApiError(409, `This ${field} is already taken`);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    const avatarColor = generateAvatarColor(email);

    // Create user
    const user = await User.create({
      email,
      username,
      displayName,
      passwordHash,
      avatarColor,
    });

    // Create default preferences
    await UserPreferences.create({ userId: user._id });

    // Generate tokens
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      plan: user.plan,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // Store refresh token
    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 30);

    await User.findByIdAndUpdate(user._id, {
      $push: {
        refreshTokens: {
          token: refreshToken,
          createdAt: new Date(),
          expiresAt: refreshExpiry,
        },
      },
    });

    // Build response with cookies
    const response = Response.json(
      {
        success: true,
        data: {
          user: {
            _id: user._id,
            email: user.email,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            avatarColor: user.avatarColor,
            plan: user.plan,
          },
        },
      },
      { status: 201 }
    );

    // Set httpOnly cookies
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
      status: 201,
      headers,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
