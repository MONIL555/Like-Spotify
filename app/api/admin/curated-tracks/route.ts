import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { withAuth, handleApiError, ApiError } from '@/lib/auth';
import CuratedTrack from '@/models/CuratedTrack';

export async function GET(req: NextRequest) {
  try {
    const jwtUser = await withAuth(req);
    if (jwtUser.role !== 'admin') {
      throw new ApiError(403, 'Forbidden: Admin access required');
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'admin_picks';

    const tracks = await CuratedTrack.find({ category }).sort({ addedAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      data: tracks,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const jwtUser = await withAuth(req);
    if (jwtUser.role !== 'admin') {
      throw new ApiError(403, 'Forbidden: Admin access required');
    }

    await connectDB();

    const body = await req.json();
    const { videoId, saavnId, title, artist, imageUrl, source, category = 'admin_picks' } = body;

    if (!videoId || !title || !artist || !source) {
      throw new ApiError(400, 'Missing required fields');
    }

    // Check limit (Max 50)
    const currentCount = await CuratedTrack.countDocuments({ category });
    if (currentCount >= 50) {
      throw new ApiError(400, 'Maximum limit of 50 tracks reached for this category.');
    }

    // Check if already exists
    const existing = await CuratedTrack.findOne({ videoId, category });
    if (existing) {
      throw new ApiError(400, 'Track is already in this curated list.');
    }

    const newTrack = await CuratedTrack.create({
      videoId,
      saavnId,
      title,
      artist,
      imageUrl,
      source,
      category,
    });

    return NextResponse.json({
      success: true,
      data: newTrack,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const jwtUser = await withAuth(req);
    if (jwtUser.role !== 'admin') {
      throw new ApiError(403, 'Forbidden: Admin access required');
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');
    const category = searchParams.get('category') || 'admin_picks';

    if (!videoId) {
      throw new ApiError(400, 'Missing videoId parameter');
    }

    await CuratedTrack.findOneAndDelete({ videoId, category });

    return NextResponse.json({
      success: true,
      message: 'Track removed from curated list',
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
