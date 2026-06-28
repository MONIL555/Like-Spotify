// ============================================================
// SoundWave — Track Model (cached YouTube metadata)
// ============================================================

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITrack extends Document {
  videoId: string;
  title: string;
  artist: string;
  channelId: string;
  channelTitle?: string;
  albumName?: string;
  thumbnails: {
    default?: string;
    medium?: string;
    high?: string;
    maxres?: string;
  };
  duration: number;
  durationText: string;
  publishedAt?: Date;
  tags: string[];
  genre?: string;
  playCount: number;
  likeCount: number;
  cachedAt: Date;
}

const TrackSchema = new Schema<ITrack>(
  {
    videoId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    artist: {
      type: String,
      required: true,
    },
    channelId: {
      type: String,
      required: true,
      index: true,
    },
    channelTitle: String,
    albumName: String,
    thumbnails: {
      default: String,
      medium: String,
      high: String,
      maxres: String,
    },
    duration: Number,
    durationText: String,
    publishedAt: Date,
    tags: [String],
    genre: String,
    playCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    cachedAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // 24-hour TTL — auto-deleted
    },
  },
  {
    timestamps: true,
  }
);

// Text search index
TrackSchema.index({ title: 'text', artist: 'text' });

const Track: Model<ITrack> =
  mongoose.models.Track || mongoose.model<ITrack>('Track', TrackSchema);

export default Track;
