// ============================================================
// SoundWave — Playlist Model
// ============================================================

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlaylistTrack {
  videoId: string;
  addedBy?: mongoose.Types.ObjectId;
  addedAt: Date;
  position: number;
}

export interface IPlaylist extends Document {
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  collaborators: mongoose.Types.ObjectId[];
  tracks: IPlaylistTrack[];
  isPublic: boolean;
  isCollaborative: boolean;
  coverImageUrl?: string;
  coverColor?: string;
  followedBy: mongoose.Types.ObjectId[];
  totalDuration: number;
  folderId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PlaylistSchema = new Schema<IPlaylist>(
  {
    name: {
      type: String,
      required: [true, 'Playlist name is required'],
      maxlength: 100,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    collaborators: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    tracks: [
      {
        videoId: { type: String, required: true },
        addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now },
        position: { type: Number, required: true },
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
    isCollaborative: {
      type: Boolean,
      default: false,
    },
    coverImageUrl: String,
    coverColor: String,
    followedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    totalDuration: {
      type: Number,
      default: 0,
    },
    folderId: {
      type: Schema.Types.ObjectId,
      ref: 'PlaylistFolder',
    },
  },
  {
    timestamps: true,
  }
);

PlaylistSchema.index({ owner: 1, createdAt: -1 });
PlaylistSchema.index({ isPublic: 1 });

const Playlist: Model<IPlaylist> =
  mongoose.models.Playlist ||
  mongoose.model<IPlaylist>('Playlist', PlaylistSchema);

export default Playlist;
