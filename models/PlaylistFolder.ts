// ============================================================
// SpotTunes — PlaylistFolder Model
// ============================================================

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlaylistFolder extends Document {
  name: string;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PlaylistFolderSchema = new Schema<IPlaylistFolder>(
  {
    name: {
      type: String,
      required: [true, 'Folder name is required'],
      maxlength: 50,
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

PlaylistFolderSchema.index({ owner: 1, name: 1 }, { unique: true });

const PlaylistFolder: Model<IPlaylistFolder> =
  mongoose.models.PlaylistFolder ||
  mongoose.model<IPlaylistFolder>('PlaylistFolder', PlaylistFolderSchema);

export default PlaylistFolder;
