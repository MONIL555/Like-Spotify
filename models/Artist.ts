// ============================================================
// SoundWave — Artist Model (cached YouTube channel)
// ============================================================

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IArtist extends Document {
  channelId: string;
  name: string;
  thumbnailUrl?: string;
  bannerUrl?: string;
  description?: string;
  subscriberCount: number;
  videoCount: number;
  cachedAt: Date;
}

const ArtistSchema = new Schema<IArtist>(
  {
    channelId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    thumbnailUrl: String,
    bannerUrl: String,
    description: String,
    subscriberCount: {
      type: Number,
      default: 0,
    },
    videoCount: {
      type: Number,
      default: 0,
    },
    cachedAt: {
      type: Date,
      default: Date.now,
      expires: 604800, // 7-day TTL
    },
  },
  {
    timestamps: true,
  }
);

ArtistSchema.index({ name: 'text' });

const Artist: Model<IArtist> =
  mongoose.models.Artist || mongoose.model<IArtist>('Artist', ArtistSchema);

export default Artist;
