import mongoose, { Schema, Document, Model } from 'mongoose';
import { ITrack } from './Track';

export interface IPlaylist extends Document {
  name: string;
  userId: mongoose.Types.ObjectId | string;
  collaborators?: (mongoose.Types.ObjectId | string)[];
  inviteToken?: string;
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
    collaborators: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    inviteToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    tracks: {
      type: [Object],
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
