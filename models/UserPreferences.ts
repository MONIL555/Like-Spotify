// ============================================================
// SoundWave — UserPreferences Model
// ============================================================

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserPreferences extends Document {
  userId: mongoose.Types.ObjectId;
  eqPreset: string;
  eqBands: {
    hz60: number;
    hz230: number;
    hz910: number;
    hz4k: number;
    hz14k: number;
  };
  crossfadeDuration: number;
  normalization: boolean;
  autoplay: boolean;
  showUnplayable: boolean;
  compactLibrary: boolean;
  showFriendActivity: boolean;
  language: string;
  excludedTrackIds: string[];
  excludedPlaylistIds: string[];
  sleepTimerMinutes: number;
}

const UserPreferencesSchema = new Schema<IUserPreferences>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  eqPreset: { type: String, default: 'flat' },
  eqBands: {
    hz60: { type: Number, default: 0, min: -12, max: 12 },
    hz230: { type: Number, default: 0, min: -12, max: 12 },
    hz910: { type: Number, default: 0, min: -12, max: 12 },
    hz4k: { type: Number, default: 0, min: -12, max: 12 },
    hz14k: { type: Number, default: 0, min: -12, max: 12 },
  },
  crossfadeDuration: { type: Number, default: 0, min: 0, max: 12 },
  normalization: { type: Boolean, default: true },
  autoplay: { type: Boolean, default: true },
  showUnplayable: { type: Boolean, default: false },
  compactLibrary: { type: Boolean, default: false },
  showFriendActivity: { type: Boolean, default: true },
  language: { type: String, default: 'en' },
  excludedTrackIds: [String],
  excludedPlaylistIds: [String],
  sleepTimerMinutes: { type: Number, default: 0 },
});

const UserPreferences: Model<IUserPreferences> =
  mongoose.models.UserPreferences ||
  mongoose.model<IUserPreferences>('UserPreferences', UserPreferencesSchema);

export default UserPreferences;
