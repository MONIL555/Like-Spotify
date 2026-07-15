import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import AppConfig from '@/models/AppConfig';
import { withAuth, handleApiError, ApiError } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const jwtUser = await withAuth(req);
    if (jwtUser.role !== 'admin') {
      throw new ApiError(403, 'Forbidden: Admin access required');
    }

    await connectDB();
    
    let config = await AppConfig.findById('global_config');
    if (!config) {
      config = await AppConfig.create({ _id: 'global_config' });
    }

    return Response.json({ success: true, data: config });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const jwtUser = await withAuth(req);
    if (jwtUser.role !== 'admin') {
      throw new ApiError(403, 'Forbidden: Admin access required');
    }

    const { phoneAuthEnabled, youtubeFallbackEnabled } = await req.json();

    await connectDB();

    const updatedConfig = await AppConfig.findByIdAndUpdate(
      'global_config',
      {
        $set: {
          ...(phoneAuthEnabled !== undefined && { phoneAuthEnabled }),
          ...(youtubeFallbackEnabled !== undefined && { youtubeFallbackEnabled }),
        }
      },
      { new: true, upsert: true }
    );

    return Response.json({ success: true, data: updatedConfig });
  } catch (error) {
    return handleApiError(error);
  }
}
