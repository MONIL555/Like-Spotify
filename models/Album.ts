// ============================================================
// SpotTunes — Album Model (YouTube playlist as album)
// ============================================================

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAlbum extends Document {
  youtubePlaylistId: string;
  title: string;
  artist: string;
  channelId: string;
  coverUrl?: string;
  trackCount: number;
  publishedAt?: Date;
  tracks: string[];
  cachedAt: Date;
}

const AlbumSchema = new Schema<IAlbum>(
  {
    youtubePlaylistId: {
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
    coverUrl: String,
    trackCount: {
      type: Number,
      default: 0,
    },
    publishedAt: Date,
    tracks: [String], // video IDs
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

AlbumSchema.index({ title: 'text', artist: 'text' });

const Album: Model<IAlbum> =
  mongoose.models.Album || mongoose.model<IAlbum>('Album', AlbumSchema);

export default Album;
