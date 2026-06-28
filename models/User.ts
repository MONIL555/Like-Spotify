// ============================================================
// SpotTunes — User Model
// ============================================================

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  avatarUrl: string | null;
  avatarColor: string;
  plan: 'free' | 'premium';
  isActive: boolean;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  likedTrackIds: string[];
  savedAlbumIds: string[];
  followedArtistIds: string[];
  refreshTokens: {
    token: string;
    createdAt: Date;
    expiresAt: Date;
  }[];
  preferences?: mongoose.Types.ObjectId;
  currentlyPlaying?: {
    videoId: string;
    title: string;
    artist: string;
    thumbnail: string;
    startedAt: Date;
    contextPlaylistId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      minlength: 3,
      maxlength: 30,
      trim: true,
      index: true,
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      maxlength: 50,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never returned by default
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    avatarColor: {
      type: String,
      default: '#1DB954',
    },
    plan: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    likedTrackIds: [String],
    savedAlbumIds: [String],
    followedArtistIds: [String],
    refreshTokens: [
      {
        token: String,
        createdAt: { type: Date, default: Date.now },
        expiresAt: Date,
      },
    ],
    preferences: {
      type: Schema.Types.ObjectId,
      ref: 'UserPreferences',
    },
    currentlyPlaying: {
      videoId: String,
      title: String,
      artist: String,
      thumbnail: String,
      startedAt: Date,
      contextPlaylistId: String,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure indexes
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
