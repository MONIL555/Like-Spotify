// ============================================================
// SpotTunes — Rate Limiting (Upstash Redis)
// ============================================================

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { ApiError } from './auth';

// ─── Redis Client ────────────────────────────────────────────

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ─── Rate Limiters ───────────────────────────────────────────

/** Auth routes: 5 attempts per 15 minutes */
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15m'),
  prefix: 'rl:auth',
  analytics: true,
});

/** General API routes: 100 requests per minute */
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1m'),
  prefix: 'rl:api',
  analytics: true,
});

/** Search routes: 20 searches per minute (protects YouTube quota) */
export const searchLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1m'),
  prefix: 'rl:search',
  analytics: true,
});

// ─── Rate Limit Check Helper ─────────────────────────────────

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<number> {
  const { success, reset, remaining } = await limiter.limit(identifier);

  if (!success) {
    throw new ApiError(
      429,
      `Rate limit exceeded. Retry after ${new Date(reset).toISOString()}`
    );
  }

  return remaining;
}

// ─── Get Client IP for Rate Limiting ─────────────────────────

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return '127.0.0.1';
}
