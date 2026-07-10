import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import { apiLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';
import Playlist from '@/models/Playlist';
import crypto from 'crypto';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(apiLimiter, ip);

    const token = req.cookies.get('access_token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const jwtUser = verifyAccessToken(token);
    const resolvedParams = await params;
    await connectDB();

    let body;
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const inviteToken = body.token;

    // Joining via token
    if (inviteToken) {
      const playlist = await Playlist.findOne({ _id: resolvedParams.id, inviteToken });
      
      if (!playlist) {
        return NextResponse.json({ error: 'Invalid invite token or playlist not found' }, { status: 404 });
      }

      // Check if already owner or collaborator
      if (playlist.userId.toString() === jwtUser.userId) {
        return NextResponse.json({ message: 'You are the owner' }, { status: 200 });
      }

      // Initialize if undefined
      if (!playlist.collaborators) {
        playlist.collaborators = [];
      }

      const isCollaborator = playlist.collaborators.some((id: any) => id.toString() === jwtUser.userId);
      if (!isCollaborator) {
        playlist.collaborators.push(jwtUser.userId);
        await playlist.save();
      }

      return NextResponse.json({ success: true, message: 'Joined collaborative playlist' });
    } 
    
    // Generating a new token (Owner only)
    else {
      const playlist = await Playlist.findOne({ _id: resolvedParams.id, userId: jwtUser.userId });
      
      if (!playlist) {
        return NextResponse.json({ error: 'Playlist not found or unauthorized' }, { status: 404 });
      }

      if (!playlist.inviteToken) {
        playlist.inviteToken = crypto.randomBytes(16).toString('hex');
        await playlist.save();
      }

      return NextResponse.json({ inviteToken: playlist.inviteToken });
    }

  } catch (error: any) {
    console.error('Playlist Collaborate POST Error:', error);
    return NextResponse.json({ error: 'Failed to process collaboration request' }, { status: 500 });
  }
}
