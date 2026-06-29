// ============================================================
// SpotTunes — JWT Authentication Helpers
// ============================================================

import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import type { JWTPayload } from '@/types';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

// ─── Custom API Error Class ──────────────────────────────────

export class ApiError extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

// ─── Token Creation ──────────────────────────────────────────

export function signAccessToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>
): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: '7d',
    algorithm: 'HS256',
  });
}

export function signRefreshToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>
): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: '30d',
    algorithm: 'HS256',
  });
}

// ─── Token Verification ─────────────────────────────────────

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, ACCESS_SECRET) as JWTPayload;
}

export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, REFRESH_SECRET) as JWTPayload;
}

// ─── Auth Middleware for API Routes ──────────────────────────

export async function withAuth(req: NextRequest): Promise<JWTPayload> {
  const token =
    req.cookies.get('access_token')?.value ||
    req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    throw new ApiError(401, 'Authentication required');
  }

  try {
    return verifyAccessToken(token);
  } catch (err) {
    if ((err as Error).name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token expired');
    }
    throw new ApiError(401, 'Invalid token');
  }
}

// ─── Error Response Helper ───────────────────────────────────

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json(
      { success: false, error: error.message },
      { status: error.statusCode }
    );
  }

  console.error('Unhandled API error:', error);
  return Response.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  );
}

// ─── Cookie Helpers ──────────────────────────────────────────

export function getAuthCookieOptions(isRefreshToken = false) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: isRefreshToken ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60, // 30 days or 7 days
    domain: process.env.COOKIE_DOMAIN || undefined,
  };
}
