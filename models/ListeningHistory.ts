// ============================================================
// SoundWave — Listening History Model
// ============================================================

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IListeningHistory extends Document {
  userId: mongoose.Types.ObjectId;
  videoId: string;
  listenedAt: Date;
  duration: number;
  source: string;
  contextId?: string;
}

const ListeningHistorySchema = new Schema<IListeningHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    videoId: {
      type: String,
      required: true,
    },
    listenedAt: {
      type: Date,
      default: Date.now,
    },
    duration: Number,
    source: {
      type: String,
      enum: ['search', 'playlist', 'recommended', 'album', 'artist', 'queue'],
    },
    contextId: String,
  },
  {
    timestamps: true,
  }
);

// TTL index: auto-delete after 90 days
ListeningHistorySchema.index(
  { listenedAt: 1 },
  { expireAfterSeconds: 7776000 }
);

// Compound index for fast recent history queries
ListeningHistorySchema.index({ userId: 1, listenedAt: -1 });

const ListeningHistory: Model<IListeningHistory> =
  mongoose.models.ListeningHistory ||
  mongoose.model<IListeningHistory>('ListeningHistory', ListeningHistorySchema);

export default ListeningHistory;
