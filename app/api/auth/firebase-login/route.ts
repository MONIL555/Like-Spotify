// ============================================================
// MoniStream — Firebase Login API Route
// ============================================================

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authAdmin } from '@/lib/firebase-admin';
import { signAccessToken, signRefreshToken, handleApiError, ApiError, getAuthCookieOptions } from '@/lib/auth';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { idToken } = await req.json();
    if (!idToken) {
      throw new ApiError(400, 'Firebase ID Token is required');
    }

    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await authAdmin.verifyIdToken(idToken);
    } catch (err) {
      throw new ApiError(401, 'Invalid Firebase ID Token');
    }

    const { uid, email, phone_number } = decodedToken;

    // Check if user exists (by email or phone)
    const query: any[] = [];
    if (email) query.push({ email });
    if (phone_number) query.push({ phoneNumber: phone_number });

    if (query.length === 0) {
      throw new ApiError(400, 'Token must contain an email or phone number');
    }

    const user = await User.findOne({ $or: query });

    if (user) {
      // Existing User -> Standard Login Flow
      const tokenPayload = {
        userId: user._id.toString(),
        email: user.email,
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
            isNewUser: false,
            user: {
              _id: user._id,
              email: user.email,
              username: user.username,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
              avatarColor: user.avatarColor,
            },
          },
        },
        { status: 200 }
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
        status: 200,
        headers,
      });
    } else {
      // New User -> Return Setup Token for Onboarding
      // Encode known info into the setup token
      const setupToken = jwt.sign(
        { 
          isSetup: true,
          email: email || null,
          phoneNumber: phone_number || null,
          uid // Store firebase uid to link later if needed
        }, 
        ACCESS_SECRET, 
        { expiresIn: '1h', algorithm: 'HS256' }
      );
      
      return Response.json(
        {
          success: true,
          data: {
            isNewUser: true,
            setupToken,
          }
        },
        { status: 200 }
      );
    }
  } catch (error) {
    return handleApiError(error);
  }
}
