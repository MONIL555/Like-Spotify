// ============================================================
// SpotTunes — Zod Validation Schemas
// ============================================================

import { z } from 'zod';

// ─── Auth Schemas ────────────────────────────────────────────

export const RegisterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be at most 50 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters')
    .regex(/[A-Z]/, 'Password needs at least one uppercase letter')
    .regex(/[0-9]/, 'Password needs at least one number'),
});

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const SendOtpSchema = z.object({
  phoneNumber: z.string().min(10, 'Invalid phone number').max(15, 'Invalid phone number'),
});

export const VerifyOtpSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
  code: z.string().length(6, 'OTP must be 6 digits'),
});

export const CompleteSignupSchema = RegisterSchema.extend({
  setupToken: z.string().min(1, 'Setup token is required'),
});

// ─── Playlist Schemas ────────────────────────────────────────

export const CreatePlaylistSchema = z.object({
  name: z
    .string()
    .min(1, 'Playlist name is required')
    .max(100, 'Playlist name must be at most 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  isPublic: z.boolean().default(false),
  isCollaborative: z.boolean().default(false),
});

export const UpdatePlaylistSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  isCollaborative: z.boolean().optional(),
  coverImageUrl: z.string().url().optional(),
});

// ─── Track Schemas ───────────────────────────────────────────

export const AddTrackSchema = z.object({
  videoId: z
    .string()
    .min(11, 'Invalid video ID')
    .max(11, 'Invalid video ID')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid video ID format'),
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(100),
  channelId: z.string().min(1),
  duration: z.number().positive(),
  thumbnail: z.string().url(),
});

// ─── Search Schemas ──────────────────────────────────────────

export const SearchSchema = z.object({
  q: z
    .string()
    .min(1, 'Search query is required')
    .max(200, 'Search query too long'),
  type: z
    .enum(['track', 'artist', 'album', 'playlist', 'all'])
    .default('all'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

// ─── User Schemas ────────────────────────────────────────────

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  avatarColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Needs uppercase')
    .regex(/[0-9]/, 'Needs number'),
});

// ─── Preferences Schemas ─────────────────────────────────────

export const UpdatePreferencesSchema = z.object({
  eqPreset: z.string().optional(),
  eqBands: z
    .object({
      hz60: z.number().min(-12).max(12),
      hz230: z.number().min(-12).max(12),
      hz910: z.number().min(-12).max(12),
      hz4k: z.number().min(-12).max(12),
      hz14k: z.number().min(-12).max(12),
    })
    .optional(),
  crossfadeDuration: z.number().min(0).max(12).optional(),
  normalization: z.boolean().optional(),
  autoplay: z.boolean().optional(),
  showUnplayable: z.boolean().optional(),
  compactLibrary: z.boolean().optional(),
  showFriendActivity: z.boolean().optional(),
  language: z.string().optional(),
  sleepTimerMinutes: z.number().min(0).optional(),
});

// ─── Type Exports ────────────────────────────────────────────

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type SendOtpInput = z.infer<typeof SendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type CompleteSignupInput = z.infer<typeof CompleteSignupSchema>;
export type CreatePlaylistInput = z.infer<typeof CreatePlaylistSchema>;
export type UpdatePlaylistInput = z.infer<typeof UpdatePlaylistSchema>;
export type AddTrackInput = z.infer<typeof AddTrackSchema>;
export type SearchInput = z.infer<typeof SearchSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;
