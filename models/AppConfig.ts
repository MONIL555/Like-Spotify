import mongoose from 'mongoose';

export interface IAppConfig extends mongoose.Document {
  _id: string; // We will use a static ID 'global_config'
  phoneAuthEnabled: boolean;
  youtubeFallbackEnabled: boolean;
  updatedAt: Date;
}

const appConfigSchema = new mongoose.Schema<IAppConfig>({
  _id: { type: String, required: true, default: 'global_config' },
  phoneAuthEnabled: { type: Boolean, default: true },
  youtubeFallbackEnabled: { type: Boolean, default: true },
}, { timestamps: true });

// Prevent multiple recompilations in Next.js development
const AppConfig = mongoose.models.AppConfig || mongoose.model<IAppConfig>('AppConfig', appConfigSchema);

export default AppConfig;
