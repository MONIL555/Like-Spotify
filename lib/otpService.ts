// ============================================================
// SpotTunes — OTP Service (Redis)
// ============================================================

import { Redis } from '@upstash/redis';
import crypto from 'crypto';

// Use a shared Redis client instance for this service
let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.error("Failed to initialize Redis client", error);
}

// In-memory fallback if Redis is not configured (development only)
const inMemoryOtpStore = new Map<string, { otp: string; expiresAt: number; attempts: number }>();

export function generateOTP(): string {
  // Generate a 6-digit random number securely
  return crypto.randomInt(100000, 999999).toString();
}

export async function storeOTP(phone: string, otp: string): Promise<void> {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  if (redis) {
    // Store in Redis with EX (expiration in seconds)
    const payload = JSON.stringify({ otp, expiresAt, attempts: 0 });
    await redis.set(`otp:${phone}`, payload, { ex: 300 }); // 300 seconds = 5 mins
  } else {
    // Fallback to memory
    inMemoryOtpStore.set(phone, { otp, expiresAt, attempts: 0 });
  }
}

export async function verifyOTP(phone: string, inputOtp: string): Promise<{ success: boolean; reason?: string }> {
  let record;

  if (redis) {
    const data = await redis.get<string>(`otp:${phone}`);
    if (data) {
      // Upstash sometimes parses JSON automatically, sometimes returns string depending on how it was stored
      record = typeof data === 'string' ? JSON.parse(data) : data;
    }
  } else {
    record = inMemoryOtpStore.get(phone);
  }

  if (!record) {
    return { success: false, reason: 'not_found' };
  }

  if (Date.now() > record.expiresAt) {
    if (redis) await redis.del(`otp:${phone}`);
    else inMemoryOtpStore.delete(phone);
    return { success: false, reason: 'expired' };
  }

  record.attempts += 1;
  
  if (record.attempts > 5) {
    if (redis) await redis.del(`otp:${phone}`);
    else inMemoryOtpStore.delete(phone);
    return { success: false, reason: 'too_many_attempts' };
  }

  if (record.otp !== inputOtp) {
    // Update attempts back in store
    if (redis) {
      await redis.set(`otp:${phone}`, JSON.stringify(record), { ex: Math.ceil((record.expiresAt - Date.now()) / 1000) });
    } else {
      inMemoryOtpStore.set(phone, record);
    }
    return { success: false, reason: 'mismatch' };
  }

  // Success: Delete OTP
  if (redis) await redis.del(`otp:${phone}`);
  else inMemoryOtpStore.delete(phone);
  
  return { success: true };
}
