import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyOTP } from '@/lib/otpService';
import { signAccessToken, signRefreshToken, handleApiError, ApiError, getAuthCookieOptions } from '@/lib/auth';
import { authLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      throw new ApiError(400, 'Phone and OTP are required');
    }

    // Rate Limiting (Protects from brute forcing the verify endpoint)
    const ip = getClientIp(req);
    await checkRateLimit(authLimiter, `otp-verify:${ip}`);
    await checkRateLimit(authLimiter, `otp-verify-phone:${phone}`);

    // Verify OTP via Redis
    const verification = await verifyOTP(phone, otp);

    if (!verification.success) {
      let errorMessage = 'Invalid OTP';
      if (verification.reason === 'expired') errorMessage = 'OTP has expired. Please request a new one.';
      if (verification.reason === 'too_many_attempts') errorMessage = 'Too many failed attempts. Please request a new OTP.';
      if (verification.reason === 'mismatch') errorMessage = 'Incorrect OTP';
      
      throw new ApiError(400, errorMessage);
    }

    // OTP is valid, connect to DB
    await connectDB();

    // Check if user exists by phone
    const user = await User.findOne({ phoneNumber: phone });

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
      // Encode known info into the setup token (Phone number in this case)
      const setupToken = jwt.sign(
        { 
          isSetup: true,
          email: null,
          phoneNumber: phone,
          uid: null // No firebase uid for phone auth anymore
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
