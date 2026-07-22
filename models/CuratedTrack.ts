import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICuratedTrack extends Document {
  videoId: string;
  saavnId?: string;
  title: string;
  artist: string;
  imageUrl: string;
  source: string;
  category: string;
  addedAt: Date;
}

const CuratedTrackSchema = new Schema<ICuratedTrack>(
  {
    videoId: { type: String, required: true },
    saavnId: { type: String },
    title: { type: String, required: true },
    artist: { type: String, required: true },
    imageUrl: { type: String },
    source: { type: String, required: true },
    category: { type: String, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

CuratedTrackSchema.index({ category: 1 });
CuratedTrackSchema.index({ videoId: 1, category: 1 }, { unique: true });

const CuratedTrack: Model<ICuratedTrack> =
  mongoose.models.CuratedTrack ||
  mongoose.model<ICuratedTrack>('CuratedTrack', CuratedTrackSchema);

export default CuratedTrack;
