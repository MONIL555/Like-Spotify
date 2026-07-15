// ============================================================
// SpotTunes — Complete OTP Signup API Route
// ============================================================

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import UserPreferences from '@/models/UserPreferences';
import { CompleteSignupSchema } from '@/lib/validations';
import { signAccessToken, signRefreshToken, handleApiError, ApiError, getAuthCookieOptions } from '@/lib/auth';
import { generateAvatarColor } from '@/lib/utils';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const validated = CompleteSignupSchema.safeParse(body);

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

    const { setupToken, email, username, displayName, password } = validated.data;

    // Verify setupToken
    let tokenEmail: string | null = null;
    let tokenPhoneNumber: string | null = null;
    let firebaseUid: string | null = null;
    try {
      const decoded = jwt.verify(setupToken, ACCESS_SECRET) as { 
        email: string | null; 
        phoneNumber: string | null;
        isSetup: boolean;
        uid: string;
      };
      if (!decoded.isSetup) {
        throw new Error('Invalid token type');
      }
      tokenEmail = decoded.email;
      tokenPhoneNumber = decoded.phoneNumber;
      firebaseUid = decoded.uid;
    } catch (err) {
      throw new ApiError(401, 'Invalid or expired setup token. Please authenticate again.');
    }

    // Use email from token if provided (Google Auth), otherwise use email from body (Phone Auth)
    const finalEmail = tokenEmail || email;
    // Phone number comes from token if Phone Auth, otherwise it's null (Google Auth)
    const finalPhoneNumber = tokenPhoneNumber;

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [
        { email: finalEmail }, 
        { username }, 
        ...(finalPhoneNumber ? [{ phoneNumber: finalPhoneNumber }] : [])
      ],
    });

    if (existingUser) {
      let field = 'email';
      if (existingUser.username === username) field = 'username';
      if (finalPhoneNumber && existingUser.phoneNumber === finalPhoneNumber) field = 'phone number';
      
      throw new ApiError(409, `This ${field} is already taken or registered`);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    const avatarColor = generateAvatarColor(finalEmail || 'user@example.com');

    // Create user
    const user = await User.create({
      email: finalEmail || '',
      username,
      displayName,
      passwordHash,
      phoneNumber: finalPhoneNumber || undefined,
      avatarColor,
    }) as any;

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
            phoneNumber: user.phoneNumber,
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
