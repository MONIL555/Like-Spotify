import mongoose, { Schema, Document, Model } from 'mongoose';
import { ITrack } from './Track';

export interface IPlaylist extends Document {
  name: string;
  userId: mongoose.Types.ObjectId | string;
  tracks: any[]; // Array of track objects
  createdAt: Date;
  updatedAt: Date;
}

const PlaylistSchema = new Schema<IPlaylist>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tracks: {
      type: [Schema.Types.Mixed],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Playlist: Model<IPlaylist> =
  mongoose.models.Playlist || mongoose.model<IPlaylist>('Playlist', PlaylistSchema);

export default Playlist;
