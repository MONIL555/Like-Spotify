// ============================================================
// SpotTunes — SearchCache Model
// ============================================================

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISearchCache extends Document {
  query: string;
  type: string;
  results: string; // JSON stringified results to handle arbitrary payload structures
  cachedAt: Date;
}

const SearchCacheSchema = new Schema<ISearchCache>(
  {
    query: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
    },
    type: {
      type: String,
      required: true,
      index: true,
    },
    results: {
      type: String,
      required: true,
    },
    cachedAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // 24-hour TTL
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookups
SearchCacheSchema.index({ query: 1, type: 1 }, { unique: true });

const SearchCache: Model<ISearchCache> =
  mongoose.models.SearchCache || mongoose.model<ISearchCache>('SearchCache', SearchCacheSchema);

export default SearchCache;
