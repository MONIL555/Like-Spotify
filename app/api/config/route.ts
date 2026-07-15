import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import AppConfig from '@/models/AppConfig';
import { handleApiError } from '@/lib/auth';
import { apiLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, `config:${ip}`);

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

    return Response.json({
      success: true,
      data: {
        phoneAuthEnabled: config.phoneAuthEnabled,
        youtubeFallbackEnabled: config.youtubeFallbackEnabled,
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
