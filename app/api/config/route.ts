import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import AppConfig from '@/models/AppConfig';
import { handleApiError } from '@/lib/auth';
import { apiLimiter, checkRateLimit, getClientIp, redis } from '@/lib/ratelimit';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, `config:${ip}`);

    // Check Redis cache first (avoids MongoDB hit on every page load)
    const cached = await redis.get('app:config');
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      const res = Response.json({ success: true, data });
      res.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
      return res;
    }

    await connectDB();
    
    let config = await AppConfig.findById('global_config');
    
    // Auto-create default config if it doesn't exist
    if (!config) {
      config = await AppConfig.create({
        _id: 'global_config',
        phoneAuthEnabled: true,
        youtubeFallbackEnabled: true,
      });
    }

    const configData = {
      phoneAuthEnabled: config.phoneAuthEnabled,
      youtubeFallbackEnabled: config.youtubeFallbackEnabled,
    };

    // Cache in Redis for 5 minutes
    await redis.set('app:config', JSON.stringify(configData), { ex: 300 });

    const res = Response.json({ success: true, data: configData });
    res.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res;
  } catch (error) {
    return handleApiError(error);
  }
}
