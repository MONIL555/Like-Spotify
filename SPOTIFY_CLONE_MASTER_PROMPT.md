# 🎵 SpotTunes — Spotify Clone: Master Build Prompt
### Full-Stack Next.js + MongoDB + YouTube API | Antigravity IDE

---

> **HOW TO USE THIS DOCUMENT**
> Paste the entire contents of this file as your first message into Antigravity IDE.
> The AI agent will use this as its complete blueprint. For each phase, reference the relevant section.
> Install all skills before starting (see Step 0 below).

---

## STEP 0 — SKILLS & TOOLS SETUP (Do this FIRST in terminal)

```bash
# 1. Install UI/UX Pro Max skill for Antigravity
npm install -g ui-ux-pro-max-cli
uipro init --ai antigravity

# 2. Add brainstorming superpowers skill for Antigravity
# In Antigravity command palette → /plugin marketplace add obra/superpowers

# 3. Install Stitch MCP for design assets (Antigravity supports MCP tools)
# In Antigravity → Settings → MCP Servers → Add: stitch

# 4. Verify skill files are present
ls .agents/skills/
# Expected: ui-ux-pro-max/   superpowers/
```

---

## 📋 PROJECT BRIEF

**App Name:** SpotTunes (you can rename)
**Purpose:** A private, personal Spotify clone for personal use, friends & family.
**Music Source:** YouTube IFrame Player API (playback) + YouTube Data API v3 (search/metadata)
**IDE:** Antigravity
**Stack:** Next.js 15 App Router · MongoDB · Tailwind CSS · shadcn/ui
**Theme:** Light theme (clean whites, soft greens, modern — Spotify-inspired but lighter)
**Deploy:** Vercel (single monorepo — frontend + API routes together)
**Auth:** JWT (access token 15min + refresh token 30 days)
**Legal Note:** Personal/family use only. No redistribution. YouTube embeds are compliant with YouTube's Terms of Service for personal projects.

---

## 🧠 AGENT INSTRUCTION PREAMBLE

You are a senior full-stack engineer building a production-grade Spotify clone.
Read this entire document before writing a single line of code.

**Core principles you must follow:**
1. Use the `ui-ux-pro-max` design skill for ALL UI work — let it generate the design system first
2. Use the `brainstorming superpowers` skill when planning feature architecture
3. Use Stitch MCP to generate UI mockups/references before implementing each major page
4. Write TypeScript everywhere — no `any` types
5. Every API route must be protected: JWT validation + Zod input validation + rate limiting
6. Mobile-first responsive design (375px → 1920px)
7. Semantic HTML, WCAG 2.1 AA accessibility
8. Follow Next.js 15 App Router conventions strictly
9. Use Server Components by default; add `"use client"` only when needed
10. Keep all environment variables in `.env.local` — never hardcode secrets

---

## 🗂️ FULL PROJECT STRUCTURE

```
SpotTunes/
├── .agents/skills/           ← Antigravity skills (auto-installed)
│   ├── ui-ux-pro-max/
│   └── superpowers/
├── app/                      ← Next.js App Router
│   ├── (auth)/               ← Auth route group (no sidebar)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (main)/               ← Main app route group (with sidebar + player)
│   │   ├── layout.tsx        ← Root layout: Sidebar + TopBar + Player
│   │   ├── page.tsx          ← Home / Discover
│   │   ├── search/
│   │   │   ├── page.tsx      ← Browse all / genre grid
│   │   │   └── [query]/page.tsx ← Search results
│   │   ├── library/
│   │   │   └── page.tsx      ← Your Library
│   │   ├── liked-songs/
│   │   │   └── page.tsx
│   │   ├── playlist/
│   │   │   └── [id]/page.tsx
│   │   ├── album/
│   │   │   └── [id]/page.tsx
│   │   ├── artist/
│   │   │   └── [id]/page.tsx
│   │   ├── queue/
│   │   │   └── page.tsx
│   │   ├── recent/
│   │   │   └── page.tsx
│   │   ├── genre/
│   │   │   └── [slug]/page.tsx
│   │   ├── profile/
│   │   │   └── [userId]/page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── api/                  ← Next.js API Routes (backend)
│   │   ├── auth/
│   │   │   ├── register/route.ts
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── refresh/route.ts
│   │   │   └── me/route.ts
│   │   ├── users/
│   │   │   ├── [id]/route.ts
│   │   │   ├── [id]/follow/route.ts
│   │   │   └── [id]/playlists/route.ts
│   │   ├── search/
│   │   │   └── route.ts      ← Proxied YouTube Data API search
│   │   ├── tracks/
│   │   │   ├── route.ts
│   │   │   └── [videoId]/route.ts
│   │   ├── playlists/
│   │   │   ├── route.ts      ← CRUD playlists
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── tracks/route.ts
│   │   │       └── collaborate/route.ts
│   │   ├── albums/
│   │   │   └── [id]/route.ts ← YouTube playlist as "album"
│   │   ├── artists/
│   │   │   └── [channelId]/route.ts
│   │   ├── library/
│   │   │   ├── liked/route.ts
│   │   │   ├── saved-albums/route.ts
│   │   │   └── followed-artists/route.ts
│   │   ├── recommendations/
│   │   │   └── route.ts      ← Based on listening history
│   │   ├── history/
│   │   │   └── route.ts
│   │   └── lyrics/
│   │       └── [videoId]/route.ts ← Fetches from lrclib.net
│   ├── layout.tsx            ← Root HTML layout
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   ├── NowPlayingBar.tsx  ← Persistent bottom player
│   │   └── MobileNav.tsx
│   ├── player/
│   │   ├── PlayerControls.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── VolumeControl.tsx
│   │   ├── FullscreenPlayer.tsx
│   │   ├── NowPlayingCard.tsx
│   │   ├── QueuePanel.tsx
│   │   └── YouTubeEmbed.tsx   ← Hidden YT iframe
│   ├── music/
│   │   ├── TrackRow.tsx
│   │   ├── TrackCard.tsx
│   │   ├── AlbumCard.tsx
│   │   ├── ArtistCard.tsx
│   │   ├── PlaylistCard.tsx
│   │   ├── GenreCard.tsx
│   │   └── LyricsView.tsx
│   ├── library/
│   │   ├── LibraryItem.tsx
│   │   ├── PlaylistFolder.tsx
│   │   └── FilterTabs.tsx
│   ├── search/
│   │   ├── SearchBar.tsx
│   │   ├── SearchResults.tsx
│   │   └── RecentSearches.tsx
│   ├── ui/                   ← shadcn/ui components
│   ├── forms/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── PlaylistForm.tsx
│   └── shared/
│       ├── Avatar.tsx
│       ├── LoadingSkeleton.tsx
│       ├── ContextMenu.tsx
│       └── ToastNotification.tsx
├── lib/
│   ├── mongodb.ts            ← MongoDB connection singleton
│   ├── auth.ts               ← JWT helpers (sign, verify, refresh)
│   ├── youtube.ts            ← YouTube Data API v3 wrapper
│   ├── ratelimit.ts          ← Rate limiting config
│   ├── validations.ts        ← Zod schemas
│   └── utils.ts              ← General utilities
├── models/                   ← Mongoose models
│   ├── User.ts
│   ├── Track.ts
│   ├── Playlist.ts
│   ├── Album.ts
│   ├── Artist.ts
│   ├── ListeningHistory.ts
│   └── UserPreferences.ts
├── hooks/                    ← React custom hooks
│   ├── usePlayer.ts
│   ├── useQueue.ts
│   ├── useSearch.ts
│   ├── useAuth.ts
│   ├── useLibrary.ts
│   └── useYouTubePlayer.ts
├── store/                    ← Zustand global state
│   ├── playerStore.ts
│   ├── queueStore.ts
│   └── authStore.ts
├── types/
│   └── index.ts              ← All shared TypeScript types
├── middleware.ts              ← Next.js middleware (auth guard, rate limit)
├── next.config.ts
├── tailwind.config.ts
├── .env.local                ← Never commit this
└── vercel.json
```

---

## 🎨 DESIGN SYSTEM (Light Theme)

> **IMPORTANT:** Run the `ui-ux-pro-max` skill FIRST. Tell it:
> *"Generate a design system for a music streaming app called SpotTunes. Light theme. Product type: music-entertainment. Style: clean-minimal with soft green accent. Reference: Spotify light mode."*

### Color Palette
```css
/* Primary Brand */
--color-brand-primary:     #1DB954;  /* Spotify green */
--color-brand-hover:       #1AA34A;
--color-brand-light:       #E8F8EE;

/* Background Scale */
--color-bg-base:           #FFFFFF;
--color-bg-subtle:         #F7F7F7;
--color-bg-card:           #FFFFFF;
--color-bg-sidebar:        #F3F3F3;
--color-bg-elevated:       #EBEBEB;
--color-bg-overlay:        rgba(0,0,0,0.4);

/* Text Scale */
--color-text-primary:      #121212;
--color-text-secondary:    #535353;
--color-text-muted:        #A7A7A7;
--color-text-on-brand:     #FFFFFF;

/* Player Bar */
--color-player-bg:         #F0F0F0;
--color-player-border:     #DFDFDF;

/* Semantic */
--color-error:             #E91429;
--color-warning:           #F59B23;
--color-success:           #1DB954;

/* Border */
--color-border:            #E8E8E8;
--color-border-focus:      #1DB954;
```

### Typography
```css
/* Font stack */
--font-primary: 'Circular', 'Helvetica Neue', Helvetica, Arial, sans-serif;
/* Fallback stack for Vercel (Circular is not free): */
--font-primary: 'Inter', system-ui, sans-serif;

--text-xs:   12px / 1.4;
--text-sm:   14px / 1.4;
--text-base: 16px / 1.5;
--text-lg:   18px / 1.4;
--text-xl:   20px / 1.3;
--text-2xl:  24px / 1.2;
--text-3xl:  32px / 1.1;

--font-weight-normal:   400;
--font-weight-medium:   500;
--font-weight-semibold: 600;
--font-weight-bold:     700;
```

### Spacing & Layout
```
Sidebar width desktop: 280px (collapsible → 72px icon-only)
Left panel min-width: 280px, max: 420px (resizable like Spotify)
Top bar height: 64px
Player bar height: 90px
Content area: calc(100vh - 64px - 90px)
Mobile breakpoint: 768px (collapse sidebar to bottom nav)
```

### Responsive Breakpoints
```
xs:  < 480px   (small phones)
sm:  480–767px (large phones)
md:  768–1023px (tablets — sidebar icon-only)
lg:  1024–1279px (laptops — sidebar + content)
xl:  1280–1535px (large laptops)
2xl: ≥ 1536px (large monitors — optional right panel)
```

---

## 📦 TECH STACK & DEPENDENCIES

```bash
# Initialize project
npx create-next-app@latest SpotTunes --typescript --tailwind --app --src-dir=no --import-alias="@/*"
cd SpotTunes

# Install shadcn/ui
npx shadcn@latest init

# Core dependencies
npm install mongoose         # MongoDB ODM
npm install jsonwebtoken     # JWT
npm install bcryptjs         # Password hashing
npm install zod              # Schema validation
npm install zustand          # Global state management
npm install @upstash/ratelimit @upstash/redis  # Rate limiting (Vercel Edge)
npm install axios            # HTTP client
npm install swr              # Data fetching/caching
npm install date-fns         # Date utilities
npm install sharp            # Image optimization
npm install cookie           # Cookie parsing

# UI Components (install needed shadcn components)
npx shadcn@latest add button input label avatar badge
npx shadcn@latest add dialog dropdown-menu sheet slider
npx shadcn@latest add toast skeleton scroll-area separator
npx shadcn@latest add progress tabs tooltip popover

# Type definitions
npm install -D @types/jsonwebtoken @types/bcryptjs @types/cookie

# Optional: lyrics
npm install lrclib          # or use free fetch to lrclib.net API

# Dev tools
npm install -D prettier eslint-config-prettier
```

### Environment Variables (`.env.local`)
```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/SpotTunes

# JWT
JWT_ACCESS_SECRET=your-super-secret-access-key-min-64-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-64-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# YouTube Data API v3
YOUTUBE_API_KEY=your-youtube-data-api-v3-key
# Get from: console.cloud.google.com → Enable YouTube Data API v3 → Create API Key
# Restrict API key to your Vercel domain for security

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_NAME=SpotTunes

# Upstash Redis (for rate limiting on Vercel)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Cookie settings
COOKIE_SECURE=false       # true in production
COOKIE_DOMAIN=localhost   # your-domain.vercel.app in production
```

---

## 🗄️ DATABASE SCHEMAS (MongoDB/Mongoose)

### User Model
```typescript
// models/User.ts
const UserSchema = new Schema({
  email:            { type: String, required: true, unique: true, lowercase: true },
  username:         { type: String, required: true, unique: true, minlength: 3 },
  displayName:      { type: String, required: true },
  passwordHash:     { type: String, required: true, select: false },
  avatarUrl:        { type: String, default: null },
  avatarColor:      { type: String, default: '#1DB954' }, // generated fallback
  plan:             { type: String, enum: ['free', 'premium'], default: 'free' },
  isActive:         { type: Boolean, default: true },
  followers:        [{ type: Schema.Types.ObjectId, ref: 'User' }],
  following:        [{ type: Schema.Types.ObjectId, ref: 'User' }],
  likedTrackIds:    [String],  // YouTube video IDs
  savedAlbumIds:    [String],  // YouTube playlist IDs
  followedArtistIds:[String],  // YouTube channel IDs
  refreshTokens:    [{ token: String, createdAt: Date, expiresAt: Date }], // array for multi-device
  preferences:      { type: Schema.Types.ObjectId, ref: 'UserPreferences' },
  createdAt:        Date,
  updatedAt:        Date,
}, { timestamps: true });
```

### Track Model (cached YouTube track metadata)
```typescript
// models/Track.ts
const TrackSchema = new Schema({
  videoId:      { type: String, required: true, unique: true }, // YouTube video ID
  title:        { type: String, required: true },
  artist:       { type: String, required: true },
  channelId:    { type: String, required: true },
  channelTitle: String,
  albumName:    String,
  thumbnails: {
    default:  String,
    medium:   String,
    high:     String,
    maxres:   String,
  },
  duration:     Number,     // seconds
  durationText: String,     // "3:45"
  publishedAt:  Date,
  tags:         [String],
  genre:        String,
  playCount:    { type: Number, default: 0 },
  likeCount:    { type: Number, default: 0 },
  cachedAt:     { type: Date, default: Date.now, expires: 86400 }, // 24h TTL cache
}, { timestamps: true });
```

### Playlist Model
```typescript
// models/Playlist.ts
const PlaylistSchema = new Schema({
  name:           { type: String, required: true, maxlength: 100 },
  description:    { type: String, maxlength: 500 },
  owner:          { type: Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators:  [{ type: Schema.Types.ObjectId, ref: 'User' }],
  tracks: [{
    videoId:     String,
    addedBy:     { type: Schema.Types.ObjectId, ref: 'User' },
    addedAt:     { type: Date, default: Date.now },
    position:    Number,
  }],
  isPublic:       { type: Boolean, default: false },
  isCollaborative:{ type: Boolean, default: false },
  coverImageUrl:  String,
  coverColor:     String,    // extracted dominant color
  followedBy:     [{ type: Schema.Types.ObjectId, ref: 'User' }],
  totalDuration:  Number,    // cached sum in seconds
  folderId:       { type: Schema.Types.ObjectId, ref: 'PlaylistFolder' },
}, { timestamps: true });
```

### Listening History Model
```typescript
// models/ListeningHistory.ts
const ListeningHistorySchema = new Schema({
  userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  videoId:    { type: String, required: true },
  listenedAt: { type: Date, default: Date.now },
  duration:   Number,       // seconds actually listened
  source:     String,       // 'search', 'playlist', 'recommended', etc.
  contextId:  String,       // playlist ID or album ID that was playing
}, { timestamps: true });
// TTL index: auto-delete after 90 days
ListeningHistorySchema.index({ listenedAt: 1 }, { expireAfterSeconds: 7776000 });
// Compound index for fast recent history queries
ListeningHistorySchema.index({ userId: 1, listenedAt: -1 });
```

### UserPreferences Model
```typescript
// models/UserPreferences.ts
const UserPreferencesSchema = new Schema({
  userId:           { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  // Equalizer
  eqPreset:         { type: String, default: 'flat' },
  eqBands: {
    hz60:  { type: Number, default: 0 }, // -12 to +12 dB
    hz230: { type: Number, default: 0 },
    hz910: { type: Number, default: 0 },
    hz4k:  { type: Number, default: 0 },
    hz14k: { type: Number, default: 0 },
  },
  // Playback
  crossfadeDuration: { type: Number, default: 0 },  // seconds
  normalization:     { type: Boolean, default: true },
  autoplay:          { type: Boolean, default: true },
  showUnplayable:    { type: Boolean, default: false },
  // UI
  compactLibrary:    { type: Boolean, default: false },
  showFriendActivity:{ type: Boolean, default: true },
  language:          { type: String, default: 'en' },
  // Taste profile exclusions
  excludedTrackIds:  [String],
  excludedPlaylistIds:[String],
  // Sleep timer
  sleepTimerMinutes: { type: Number, default: 0 },
});
```

### PlaylistFolder Model
```typescript
// models/PlaylistFolder.ts
const PlaylistFolderSchema = new Schema({
  name:       { type: String, required: true },
  owner:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  color:      String,
}, { timestamps: true });
```

---

## 🔐 SECURITY IMPLEMENTATION

### JWT Auth Flow
```typescript
// lib/auth.ts
import jwt from 'jsonwebtoken';

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface JWTPayload {
  userId: string;
  email:  string;
  plan:   'free' | 'premium';
  iat?:   number;
  exp?:   number;
}

export function signAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m', algorithm: 'HS256' });
}

export function signRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '30d', algorithm: 'HS256' });
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, ACCESS_SECRET) as JWTPayload;
}

export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, REFRESH_SECRET) as JWTPayload;
}
```

### Auth Middleware Pattern (for API routes)
```typescript
// Every protected API route must call this:
export async function withAuth(req: NextRequest): Promise<JWTPayload> {
  const token = req.cookies.get('access_token')?.value
    || req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) throw new ApiError(401, 'Authentication required');

  try {
    return verifyAccessToken(token);
  } catch (err) {
    if ((err as Error).name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token expired');
    }
    throw new ApiError(401, 'Invalid token');
  }
}
```

### Rate Limiting (Upstash Redis — works on Vercel Edge)
```typescript
// lib/ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis }     from '@upstash/redis';

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different limiters for different route types
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15m'),   // 5 attempts per 15 minutes
  prefix:  'rl:auth',
});

export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1m'),  // 100 req/min for general API
  prefix:  'rl:api',
});

export const searchLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1m'),   // 20 searches/min (protect YT quota)
  prefix:  'rl:search',
});

// Helper: call this at top of every API route
export async function checkRateLimit(limiter: Ratelimit, identifier: string) {
  const { success, reset, remaining } = await limiter.limit(identifier);
  if (!success) {
    throw new ApiError(429, `Rate limit exceeded. Retry after ${new Date(reset).toISOString()}`);
  }
  return remaining;
}
```

### Next.js Middleware (Route Protection)
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/api/auth'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check access token for page routes
  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    verifyAccessToken(token);
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('access_token');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};
```

### Zod Validation Schemas
```typescript
// lib/validations.ts
import { z } from 'zod';

export const RegisterSchema = z.object({
  email:       z.string().email(),
  username:    z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(50),
  password:    z.string().min(8).max(100)
    .regex(/[A-Z]/, 'Needs uppercase')
    .regex(/[0-9]/, 'Needs number'),
});

export const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const CreatePlaylistSchema = z.object({
  name:          z.string().min(1).max(100),
  description:   z.string().max(500).optional(),
  isPublic:      z.boolean().default(false),
  isCollaborative: z.boolean().default(false),
});

export const AddTrackSchema = z.object({
  videoId:   z.string().min(11).max(11).regex(/^[a-zA-Z0-9_-]+$/),
  title:     z.string().min(1).max(200),
  artist:    z.string().min(1).max(100),
  channelId: z.string(),
  duration:  z.number().positive(),
  thumbnail: z.string().url(),
});

export const SearchSchema = z.object({
  q:        z.string().min(1).max(200),
  type:     z.enum(['track', 'artist', 'album', 'playlist', 'all']).default('all'),
  page:     z.coerce.number().min(1).default(1),
  limit:    z.coerce.number().min(1).max(50).default(20),
});
```

### Security Headers (`next.config.ts`)
```typescript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control',    value: 'on' },
  { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-XSS-Protection',         value: '1; mode=block' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com",
      "frame-src https://www.youtube.com",
      "img-src 'self' data: https://i.ytimg.com https://yt3.ggpht.com blob:",
      "media-src 'self' blob:",
      "connect-src 'self' https://www.googleapis.com",
      "style-src 'self' 'unsafe-inline'",
    ].join('; ')
  }
];
```

---

## 🎬 YOUTUBE API INTEGRATION

### Architecture Decision
- **Playback:** YouTube IFrame Player API (free, no quota cost) — runs in hidden `<iframe>`
- **Search:** YouTube Data API v3 → cached in MongoDB 24h (reduces quota usage)
- **Metadata:** YouTube Data API v3 `videos.list` (1 unit per call) — cached aggressively
- **Audio Quality:** YouTube serves audio at ~128kbps AAC (free) or ~256kbps (some videos). Close to Spotify's 160kbps premium. Users cannot directly control this but YouTube will serve best available.

### YouTube IFrame Player (Hidden)
```typescript
// components/player/YouTubeEmbed.tsx
// Keep the YouTube iframe hidden visually — only its audio matters
// The iframe must be on-page (not display:none) for audio to play
// Use: position absolute, width/height 1px, overflow hidden, opacity 0

"use client"
import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/playerStore';

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function YouTubeEmbed() {
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentTrack, isPlaying, volume, setDuration, setCurrentTime } = usePlayerStore();

  useEffect(() => {
    // Load YouTube IFrame API script once
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = initPlayer;
    if (window.YT?.Player) initPlayer();
  }, []);

  function initPlayer() {
    playerRef.current = new window.YT.Player(containerRef.current!, {
      height: '1', width: '1',
      playerVars: {
        autoplay:       0,
        controls:       0,
        disablekb:      1,
        enablejsapi:    1,
        modestbranding: 1,
        playsinline:    1,
        rel:            0,
        origin:         window.location.origin,
      },
      events: {
        onReady:       onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError:       onPlayerError,
      },
    });
  }
  // ... (onReady, onStateChange, time tracking, etc.)

  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', top: -9999, left: -9999, width: 1, height: 1, overflow: 'hidden' }}
    >
      <div ref={containerRef} />
    </div>
  );
}
```

### YouTube Data API Wrapper (Server-side only)
```typescript
// lib/youtube.ts
const YT_API_KEY = process.env.YOUTUBE_API_KEY!;
const YT_BASE    = 'https://www.googleapis.com/youtube/v3';

export interface YTSearchItem {
  videoId:     string;
  title:       string;
  channelId:   string;
  channelName: string;
  thumbnail:   string;
  publishedAt: string;
}

// Search for music tracks
export async function searchYouTube(
  query: string,
  maxResults = 20,
  pageToken?: string
): Promise<{ items: YTSearchItem[]; nextPageToken?: string }> {
  const params = new URLSearchParams({
    part:       'snippet',
    q:          `${query} official audio OR lyrics OR music video`,
    type:       'video',
    videoCategoryId: '10', // Music category
    maxResults:  String(maxResults),
    key:         YT_API_KEY,
    ...(pageToken ? { pageToken } : {}),
  });

  const res = await fetch(`${YT_BASE}/search?${params}`, {
    next: { revalidate: 3600 }, // Next.js cache 1hr
  });

  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  const data = await res.json();

  return {
    items: data.items.map((item: any) => ({
      videoId:     item.id.videoId,
      title:       item.snippet.title,
      channelId:   item.snippet.channelId,
      channelName: item.snippet.channelTitle,
      thumbnail:   item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      publishedAt: item.snippet.publishedAt,
    })),
    nextPageToken: data.nextPageToken,
  };
}

// Get video details (duration, tags, etc.)
export async function getVideoDetails(videoIds: string[]) {
  const params = new URLSearchParams({
    part:  'snippet,contentDetails,statistics',
    id:    videoIds.join(','),
    key:   YT_API_KEY,
  });

  const res = await fetch(`${YT_BASE}/videos?${params}`, {
    next: { revalidate: 86400 }, // cache 24hr
  });

  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  return res.json();
}

// Convert ISO 8601 duration to seconds: PT3M45S → 225
export function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (Number(match[1] || 0) * 3600) +
         (Number(match[2] || 0) * 60)   +
         Number(match[3] || 0);
}
```

### Quota Management Strategy
```
Daily budget: 10,000 units
- search.list costs 100 units each → max 100 searches/day
- videos.list costs 1 unit each   → max 10,000 video lookups/day

Mitigation:
1. Cache all search results in MongoDB for 24h (TTL index)
2. Cache all video metadata in Track model for 24h
3. Rate limit /api/search to 20 req/min per user (searchLimiter)
4. Deduplicate: if track already in DB, skip API call entirely
5. Use YouTube IFrame for playback (zero quota cost)
6. Consider multiple API keys (different Google accounts) for higher limits
```

---

## 🎵 FEATURES IMPLEMENTATION GUIDE

### 1. PERSISTENT MUSIC PLAYER (NowPlayingBar)

The player bar sits at the bottom of every page. It must never unmount.
Implement using Zustand store so state survives navigation.

**Player Bar Sections (left → center → right):**
- **Left:** Track thumbnail + title (scrolling marquee if long) + artist + heart (like) button
- **Center:** Previous · Play/Pause · Next · Shuffle · Repeat toggles + Progress bar (seekable)
- **Right:** Lyrics toggle · Queue toggle · Devices icon · Volume slider

**Controls to implement:**
```
Play / Pause          → YT player.playVideo() / player.pauseVideo()
Next Track            → pop from queue, load next
Previous Track        → if >3s played: seek to 0; else load previous
Seek                  → player.seekTo(seconds, true)
Volume                → player.setVolume(0-100)
Mute                  → player.mute() / player.unMute()
Shuffle               → Fisher-Yates shuffle of queue array
Repeat Off/One/All    → cycle through 3 states
Crossfade             → overlap 2 players (advanced — see crossfade section)
```

**Zustand Player Store:**
```typescript
// store/playerStore.ts
interface PlayerState {
  currentTrack:    Track | null;
  isPlaying:       boolean;
  volume:          number;         // 0-100
  isMuted:         boolean;
  shuffle:         boolean;
  repeat:          'off' | 'one' | 'all';
  currentTime:     number;         // seconds
  duration:        number;         // seconds
  isLyricsOpen:    boolean;
  isQueueOpen:     boolean;
  isFullscreen:    boolean;
  contextPlaylistId: string | null; // which playlist is being played
}
```

### 2. PLAY QUEUE

```typescript
// store/queueStore.ts
interface QueueState {
  queue:           Track[];        // upcoming tracks
  history:         Track[];        // played tracks
  originalQueue:   Track[];        // pre-shuffle order
  currentIndex:    number;
  // Actions
  addToQueue:      (track: Track, position?: 'next' | 'last') => void;
  removeFromQueue: (index: number) => void;
  reorderQueue:    (from: number, to: number) => void;
  clearQueue:      () => void;
  playNext:        () => Track | null;
  playPrevious:    () => Track | null;
  loadPlaylist:    (tracks: Track[], startIndex?: number) => void;
}
```

**Queue Panel UI:**
- "Now Playing" section (current track)
- "Next in queue" (manually added tracks)
- "Next from: [playlist name]" (auto-queue from context)
- Drag-to-reorder (use `@dnd-kit/sortable`)
- Right-click context menu on each queue item

### 3. HOME PAGE

Sections to display (API-driven):
```
1. Good morning / Good afternoon / Good evening (time-based)
2. Jump back in          → last 6 recently played (playlists/albums)
3. Your top mixes        → personalized genre mixes based on history
4. Made for you          → Discover Weekly style (based on liked songs)
5. Recently played       → last 20 played tracks
6. New releases          → search YouTube for trending music
7. Charts               → popular tracks by genre
8. Based on your likes   → related artists' tracks
9. Featuring [artist]   → spotlight on followed artist
```

### 4. SEARCH

**Browse Page (no query):**
- Grid of genre cards with gradient backgrounds
- Genres: Pop, Hip-Hop, Rock, Electronic, R&B, Jazz, Classical, K-Pop,
  Latin, Reggae, Country, Metal, Indie, Soul, Blues, Folk, Soundtrack, Podcasts

**Search Results (with query):**
```
Tab 1: All       → Top result card + tracks + artists + albums + playlists
Tab 2: Songs     → Paginated track list
Tab 3: Artists   → Artist cards grid
Tab 4: Albums    → Album cards grid
Tab 5: Playlists → Playlist cards grid
```

**Search Features:**
- Real-time autocomplete (debounced 300ms)
- Recent searches (stored in localStorage + DB)
- Lyrics search — embed "(lyrics)" in query when content looks like lyrics
- Search autocomplete pulls from: recent searches → cached DB → YouTube API

### 5. YOUR LIBRARY

**Sidebar Library Panel (collapsible, resizable):**
```
Header: [Library icon] Your Library   [+] [→]

Filter Pills: Playlists | Albums | Artists | Podcasts

Sort options: Recents | Recently Added | Alphabetical | Creator

Items displayed:
• Liked Songs     (special playlist icon, always first)
• [Playlist Folders]
  └── Playlist items
• Individual playlists
• Saved albums
• Followed artists
```

**Library Item Component:**
- Thumbnail (40px square, rounded-sm)
- Title + subtitle
- Type badge (Playlist / Album / Artist)
- Right-click context menu

### 6. PLAYLISTS

**Playlist Page (`/playlist/[id]`):**
- Header: large cover art + gradient blur background + title + owner + track count + total duration
- Action buttons: Play · Shuffle Play · Follow/Unfollow · ••• menu
- Track list table: # · Title+Artist · Album · Date added · Duration · Heart
- Sort column headers (clickable)
- "Add more like this" recommended tracks at bottom
- Drag-to-reorder tracks (auth: owner/collaborator only)

**Create / Edit Playlist:**
- Modal dialog
- Image upload (stored as base64 or external URL)
- Name (required)
- Description (optional)
- Public/Private toggle
- Collaborative toggle

**Collaborative Playlists:**
- Owner can invite by username
- Collaborators can add/remove tracks
- Show "Added by [username]" in track list
- Real-time updates using SWR polling (every 30s)

**Playlist Folders:**
- Right-click playlist → "Move to folder" or "Create folder"
- Drag-and-drop into folders in sidebar
- Folders are collapsible in sidebar

### 7. ARTIST PAGES (`/artist/[channelId]`)

```
Hero: Channel banner + name + verified badge + monthly listeners

Tabs:
  Overview:
    Popular tracks (top 5, expandable to top 10)
    Popular releases (albums/singles — YouTube playlists)
    Featuring playlists
    Appears on
    Fans also like (related channels/artists)

  Discography:
    All albums/EPs/singles
    Filter: Albums | Singles | Compilations

Artist about:
  Bio (from YouTube channel description)
  Social links
```

### 8. ALBUM PAGES (`/album/[playlistId]`)

YouTube playlists serve as "albums":
```
Header: Cover art + Album title + Artist + Year + Track count + Duration
Play · Shuffle · Save · ••• menu

Track listing table: # · Title · Duration · Heart
"More by [artist]" section at bottom
```

### 9. LYRICS

```typescript
// Use lrclib.net — free, no API key required
// Endpoint: https://lrclib.net/api/search?track_name=...&artist_name=...

export async function getLyrics(trackName: string, artistName: string) {
  const url = `https://lrclib.net/api/search?${new URLSearchParams({
    track_name:  trackName,
    artist_name: artistName,
  })}`;

  const res = await fetch(url, { next: { revalidate: 86400 } });
  const data = await res.json();

  if (!data[0]) return null;

  return {
    syncedLyrics:  data[0].syncedLyrics,  // LRC format with timestamps
    plainLyrics:   data[0].plainLyrics,
    duration:      data[0].duration,
  };
}
```

**Lyrics Display:**
- Full-height panel slides in from right (desktop) or overlays (mobile)
- Plain lyrics: scrollable, formatted
- Synced lyrics: highlight current line as song plays, auto-scroll
- "Lyrics not available" graceful fallback

### 10. EQUALIZER

- 5-band EQ: 60Hz · 230Hz · 910Hz · 4kHz · 14kHz
- Range: -12dB to +12dB per band
- Presets: Flat, Bass Boost, Treble Boost, Loudness, Classical, Dance, Deep, Electronic, Hip-Hop, Jazz, Latin, Lounge, Piano, Pop, R&B, Rock, Small Speakers, Spoken Word
- Implemented using Web Audio API (BiquadFilterNode)
- Sits between the YouTube audio output and speakers via AudioContext

```typescript
// hooks/useEqualizer.ts
// Connect YouTube player audio to AudioContext via MediaElementSourceNode
// Then chain through BiquadFilterNode for each band
```

**Note:** YouTube IFrame audio cannot be directly intercepted via Web Audio API due to cross-origin restrictions. Display the EQ as visual controls only and store preferences. Actual EQ effect only applies to local audio sources. Show a tooltip: "EQ visualization — applies to local playback."

### 11. SLEEP TIMER

```typescript
// In player controls: Settings → Sleep Timer
// Options: 5 min, 10 min, 15 min, 30 min, 45 min, 1 hour, End of track
// Countdown shown in settings or notification area
// On expiry: fade out volume, pause, show notification
```

### 12. SOCIAL / FRIEND ACTIVITY

```
Right panel (desktop only, togglable):
  "Friend Activity"
  [Avatar] [Username] is listening to
  [Track Title] — [Artist]
  on [Playlist Name]
  [X minutes ago]

Updates: SWR polling every 60 seconds
Implementation: Store current listening session in user document
  { userId, currentTrack: {...}, startedAt, contextPlaylistId }
```

### 13. USER PROFILES

```
/profile/[userId]:
  Banner + Avatar + Display name + Follow count + Followers count
  Public playlists grid
  Following list
  Followers list
  [Follow / Following] button
```

### 14. SETTINGS PAGE

Sections:
```
Account:          Display name · Email · Password · Avatar
Subscription:     Plan info (free/premium distinction)

Playback:
  Audio quality   → (informational — YouTube controls actual quality)
  Crossfade       → 0-12 seconds slider
  Volume normalize→ toggle
  Autoplay        → toggle

Display:
  Language        → dropdown
  Compact library → toggle
  Show unplayable tracks → toggle

Privacy:
  Listening activity → toggle (show in friend activity)
  Private session → toggle (no history recording)
  Clear listening history → button

Notifications:
  New music from followed artists → toggle
  Collaborative playlist activity → toggle

Social:
  Connect/disconnect profile links

About:
  App version, licenses
```

### 15. SMART RECOMMENDATIONS (Made For You)

```typescript
// app/api/recommendations/route.ts
// Algorithm (simplified personalization without ML):

// 1. Get user's top 10 most played artists (from ListeningHistory, last 30 days)
// 2. Get user's liked tracks
// 3. Search YouTube for: "[top artist] type:channelId related"
// 4. Search for similar genre keywords
// 5. Exclude already-liked tracks
// 6. Return 30 recommended tracks

export async function getRecommendations(userId: string): Promise<Track[]> {
  // Get top artists from listening history
  const topArtists = await ListeningHistory.aggregate([
    { $match: { userId, listenedAt: { $gte: thirtyDaysAgo } }},
    { $group: { _id: '$channelId', count: { $sum: 1 } }},
    { $sort:  { count: -1 }},
    { $limit: 5 },
  ]);

  // Search YouTube for tracks from each top artist
  const results = await Promise.all(
    topArtists.map(a => searchYouTube(`${a.channelTitle} new songs 2024`, 6))
  );

  // Flatten, deduplicate, exclude liked tracks
  return deduplicateAndFilter(results.flat(), userLikedIds);
}
```

---

## 🔌 API ROUTES SPECIFICATION

### Auth Routes

```
POST /api/auth/register
  Body: { email, username, displayName, password }
  Returns: { user, accessToken }
  Sets cookie: access_token (httpOnly), refresh_token (httpOnly)

POST /api/auth/login
  Body: { email, password }
  Returns: { user, accessToken }
  Sets cookie: access_token, refresh_token

POST /api/auth/logout
  Auth: required
  Clears cookies, invalidates refresh token in DB

POST /api/auth/refresh
  Cookie: refresh_token
  Returns: { accessToken }
  Sets cookie: new access_token

GET  /api/auth/me
  Auth: required
  Returns: { user } (without passwordHash)
```

### Track Routes

```
GET  /api/tracks/[videoId]
  Auth: required
  Returns: track metadata (from DB cache or YouTube API)

POST /api/tracks/[videoId]/play
  Auth: required
  Body: { duration, contextId, source }
  Increments playCount, records history

POST /api/tracks/[videoId]/like
  Auth: required
  Toggles like, returns { liked: boolean }
```

### Search Routes

```
GET  /api/search?q=...&type=...&page=...&limit=...
  Auth: required
  Rate limit: 20/min
  Checks DB cache first → falls back to YouTube API
  Returns: { tracks, artists, albums, playlists, nextPageToken }
```

### Playlist Routes

```
GET    /api/playlists?userId=...
GET    /api/playlists/[id]
POST   /api/playlists              (create)
PUT    /api/playlists/[id]         (update name/desc/cover/privacy)
DELETE /api/playlists/[id]         (owner only)

POST   /api/playlists/[id]/tracks  (add track)
DELETE /api/playlists/[id]/tracks?videoId=...  (remove track)
PUT    /api/playlists/[id]/tracks/reorder  (drag-drop reorder)

POST   /api/playlists/[id]/follow
DELETE /api/playlists/[id]/follow

POST   /api/playlists/[id]/collaborate   (add collaborator by username)
DELETE /api/playlists/[id]/collaborate/[userId]
```

### Library Routes

```
GET  /api/library/liked?page=...    (paginated liked songs)
POST /api/library/liked             (like/unlike track)

GET  /api/library/saved-albums
POST /api/library/saved-albums      (save/unsave album)

GET  /api/library/followed-artists
POST /api/library/followed-artists  (follow/unfollow artist)
```

### User Routes

```
GET  /api/users/[id]
PUT  /api/users/[id]           (update profile — own profile only)
POST /api/users/[id]/follow    (follow/unfollow user)
GET  /api/users/[id]/playlists (public playlists)
GET  /api/users/[id]/followers
GET  /api/users/[id]/following
```

### History & Recommendations

```
GET  /api/history?limit=50     (recent listening history)
DEL  /api/history              (clear all history)

GET  /api/recommendations      (personalized tracks)
```

### Lyrics

```
GET  /api/lyrics/[videoId]?title=...&artist=...
  Fetches from lrclib.net, caches in MongoDB (TTL 7 days)
  Returns: { syncedLyrics, plainLyrics }
```

---

## 📱 RESPONSIVE LAYOUT SPECIFICATION

### Mobile (< 768px)
```
Layout:
  - No sidebar (hidden)
  - Top bar: Logo + Search icon + Avatar
  - Content: full width
  - Bottom: Mini player (48px, tap to expand) + Tab nav bar (64px)

Tab Navigation (bottom):
  🏠 Home · 🔍 Search · 📚 Library · 👤 Profile

Mini Player (bottom, above tab nav):
  [Thumbnail 40px] [Title + Artist truncated] [♥] [▶/⏸] [⏭]

Full-screen Player (tap mini player):
  Large album art (centered)
  Title + Artist
  Seek bar
  Controls row
  Volume slider
  Lyrics · Queue · Share buttons
```

### Tablet (768–1023px)
```
Layout:
  - Sidebar collapsed to icon-only (72px)
  - Top bar visible
  - Player bar full

Sidebar icons:
  🏠 Home · 🔍 Search · 📚 Library · ➕ Create · ♥ Liked
```

### Desktop (≥ 1024px)
```
Layout:
  - Sidebar: 280px (expandable to 420px by dragging)
  - Main content: fluid
  - Optional right panel: 300px (Friend Activity / Queue)
  - Player bar: full width at bottom

Sidebar:
  [Logo]
  Navigation:
    🏠 Home
    🔍 Search
  ─────────────────
  [Your Library]  [+] [→ expand]
  [Filter pills]
  [Scrollable library list]
```

---

## 🔄 STATE MANAGEMENT ARCHITECTURE

### Global State (Zustand)
```
playerStore:  current track, playing state, volume, repeat, shuffle, time
queueStore:   queue array, history, index
authStore:    user object, JWT, isLoading
```

### Server State (SWR)
```
/api/auth/me              → user profile (auto-refresh)
/api/library/liked        → liked songs
/api/playlists            → user playlists
/api/history              → recently played
/api/recommendations      → "Made for you"
/api/search               → search results (keyed by query)
```

### Local State (React useState)
```
Search input text
Modal open/close states
Dropdown open/close states
Sidebar width (resize)
Active tab
```

---

## 🎨 UI COMPONENTS — KEY DESIGN DECISIONS

### Track Row (in playlist/search results)
```
Desktop: [#] [thumbnail 40px + title + artist] [album] [date added] [duration] [♥]
Mobile:  [thumbnail] [title + artist] [♥] [▶]

Hover state:    highlight row, show ▶ icon over #
Playing state:  animated equalizer bars over # position, green text for title
Context menu:   right-click → Add to queue · Add to playlist · Like · Share · Artist page · Album page
```

### Cards (for grid views — albums, artists, playlists)
```
Size: 180px × auto (text below)
Image: square for albums/playlists, circle for artists (200×200)
Hover: slight scale(1.03) + shadow + green ▶ button appears
Text: Title (bold, 14px) + subtitle (muted, 13px), 2-line ellipsis
```

### Now Playing Bar Design
```
Height: 90px
Background: var(--color-player-bg) + top border
Sections use: display:grid grid-cols-3 items-center

Left (1/3):   [img 56px] [track info] [♥]
Center (1/3): [controls row] + [progress bar]
Right (1/3):  [lyrics btn] [queue btn] [device btn] [volume icon + slider]
```

---

## 🚀 IMPLEMENTATION PHASES

Work through these phases in order. Complete each phase fully before moving to next.

### PHASE 1 — Foundation (Start Here)
```
□ Initialize Next.js 15 project with TypeScript
□ Install all dependencies (see Tech Stack section)
□ Set up MongoDB connection (lib/mongodb.ts singleton)
□ Create all Mongoose models
□ Set up environment variables
□ Configure Tailwind with custom colors from Design System
□ Install and configure shadcn/ui
□ Set up Zustand stores (playerStore, queueStore, authStore)
□ Implement custom API error handler utility
```

### PHASE 2 — Authentication
```
□ Register API route with Zod validation + bcrypt + JWT
□ Login API route
□ Refresh token API route
□ Logout API route
□ /api/auth/me route
□ Next.js middleware for route protection
□ Auth store (Zustand) with SWR for /me
□ Login page UI
□ Register page UI
□ Forgot password page UI (email flow)
□ Protected route HOC / redirect logic
```

### PHASE 3 — Core Player
```
□ YouTubeEmbed hidden iframe component
□ YouTube IFrame API integration hook (useYouTubePlayer)
□ Player store actions (play, pause, seek, volume, next, prev)
□ Queue store with all actions
□ NowPlayingBar component (full desktop layout)
□ Mini player for mobile
□ Fullscreen player modal
□ Progress bar with seek (click + drag)
□ Volume slider
□ Shuffle algorithm
□ Repeat cycling
□ Keyboard shortcuts (Space, Arrow keys, M for mute)
□ Record listening history on track play
```

### PHASE 4 — Layout & Navigation
```
□ Root layout with sidebar + topbar + player
□ Sidebar component (desktop)
□ Mobile bottom tab navigation
□ TopBar with search + avatar + actions
□ Responsive layout switching (useMediaQuery)
□ Sidebar resize handle (desktop)
□ Sidebar collapse/expand
```

### PHASE 5 — Search & Discovery
```
□ YouTube Data API wrapper (lib/youtube.ts)
□ /api/search route with rate limiting + DB caching
□ Search page (genre grid)
□ Search results page with tabs
□ SearchBar with debounced autocomplete
□ Recent searches (localStorage + DB)
□ Genre cards with gradient colors
□ Track/Artist/Album/Playlist result cards
```

### PHASE 6 — Library & Liked Songs
```
□ /api/library routes (liked, albums, artists)
□ Like/Unlike track toggle (heart button everywhere)
□ Liked Songs page
□ Your Library page (sidebar panel)
□ Library filter pills
□ Library sort options
□ Saved Albums section
□ Followed Artists section
```

### PHASE 7 — Playlists
```
□ Create playlist flow (modal + API)
□ Playlist detail page
□ Add track to playlist (dropdown selection)
□ Remove track from playlist
□ Drag-to-reorder tracks (dnd-kit)
□ Edit playlist (name, description, cover)
□ Public/Private toggle
□ Delete playlist
□ Follow/Unfollow playlist
□ Collaborative playlist (invite by username)
□ Playlist folder creation/management
□ Share playlist (copy link)
```

### PHASE 8 — Artist & Album Pages
```
□ /api/artists/[channelId] route (YouTube channel data)
□ Artist page component
□ Artist top tracks
□ Artist discography (channel playlists as albums)
□ Related artists section
□ /api/albums/[id] route (YouTube playlist as album)
□ Album page component
□ Follow artist functionality
```

### PHASE 9 — Home & Recommendations
```
□ Home page with all sections
□ /api/recommendations route
□ Listening history aggregation
□ "Recently played" section
□ "Made for you" section
□ "New releases" section (YouTube trending music search)
□ Time-based greeting
□ Section horizontal scroll carousels
```

### PHASE 10 — Lyrics & Equalizer
```
□ /api/lyrics route (lrclib.net proxy + cache)
□ Lyrics panel component
□ Real-time synced lyrics (timestamp matching to currentTime)
□ Lyrics auto-scroll
□ Equalizer UI component (5-band sliders)
□ EQ preset picker
□ EQ settings saved to UserPreferences
□ Sleep timer UI + logic
```

### PHASE 11 — Social Features
```
□ User profile pages
□ Follow/Unfollow users
□ Friend activity panel (desktop right sidebar)
□ Current listening status (stored in User doc, SWR polling)
□ In-app notifications (new follower, collaborative playlist edit)
```

### PHASE 12 — Settings & Preferences
```
□ Settings page (all sections)
□ Avatar upload
□ Display name / email change
□ Password change
□ Privacy settings
□ Clear listening history
□ UserPreferences API routes
□ Crossfade setting (saved, applied if possible)
□ Volume normalization toggle
```

### PHASE 13 — Polish & Production
```
□ Loading skeletons for all data-dependent components
□ Error boundaries with graceful fallbacks
□ Empty states (no results, empty library, etc.)
□ Toast notifications for all user actions
□ Keyboard shortcut guide modal (?)
□ Image lazy loading + blur placeholders
□ SEO metadata (Next.js metadata API)
□ Performance audit (Lighthouse)
□ Mobile touch gestures (swipe to dismiss queue, etc.)
□ Accessibility audit (axe-core)
□ Dark mode skeleton (preserve in CSS vars for future)
□ Rate limit error handling UX
□ Network error handling + retry logic
□ vercel.json configuration
□ README.md with setup instructions
```

---

## 🌐 VERCEL DEPLOYMENT

### `vercel.json`
```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "env": {
    "MONGODB_URI": "@mongodb_uri",
    "JWT_ACCESS_SECRET": "@jwt_access_secret",
    "JWT_REFRESH_SECRET": "@jwt_refresh_secret",
    "YOUTUBE_API_KEY": "@youtube_api_key",
    "UPSTASH_REDIS_REST_URL": "@upstash_redis_rest_url",
    "UPSTASH_REDIS_REST_TOKEN": "@upstash_redis_rest_token"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

### Deployment Steps (you do this yourself)
```bash
# 1. Push code to GitHub
git init && git add . && git commit -m "initial commit"
gh repo create SpotTunes --private && git push

# 2. Connect Vercel to GitHub repo
# Go to vercel.com → New Project → Import your repo

# 3. Add environment variables in Vercel dashboard:
# Settings → Environment Variables → add all from .env.local

# 4. Set up MongoDB Atlas (free tier M0 works for personal use):
# atlas.mongodb.com → Create cluster → Get connection string

# 5. Set up Upstash Redis (free tier):
# upstash.com → Create database → Copy REST URL + token

# 6. Get YouTube API key:
# console.cloud.google.com → New Project → Enable YouTube Data API v3
# → Credentials → Create API Key → Restrict to your domain

# 7. Deploy
vercel --prod
```

---

## 🔔 IMPORTANT AGENT NOTES

1. **Music playback MUST use YouTube IFrame API** — never try to download or stream audio files directly. The IFrame API is the only compliant way.

2. **Never expose YOUTUBE_API_KEY on the client side** — all YouTube API calls must go through `/api/search` and `/api/tracks` server routes. Only `NEXT_PUBLIC_*` vars are safe for client.

3. **YouTube Terms of Service** — since this is for personal/family use only, embedding YouTube videos via IFrame API is permitted. Do NOT add monetization, ads, or make this publicly accessible to strangers.

4. **Audio quality reality** — YouTube audio quality is approximately 128kbps (standard) to 256kbps (some videos). It cannot match Spotify's 320kbps OGG Vorbis directly. The user should know this is "very good" quality, not "exactly identical" to Spotify.

5. **Crossfade limitation** — True crossfade requires two simultaneous audio streams. Since we use a single YouTube IFrame, implement a volume fade-in/fade-out on track change instead of true crossfade. This is acceptable UX.

6. **Rate limiting is mandatory** — Never skip rate limiting on any route. YouTube API quota is 10,000 units/day. One `search.list` call costs 100 units, meaning only 100 searches/day are free. Cache everything.

7. **Single codebase, single deployment** — The Next.js App Router handles both frontend pages and backend API routes. No separate Express server needed. Deploy everything to Vercel as one project.

8. **Mobile performance** — Lazy load heavy components (Lyrics panel, Equalizer, Queue). Use dynamic imports for components not needed on initial render.

9. **When using Stitch MCP** — generate mockups for: Home page, Player bar, Playlist detail, Search results, Artist page, Settings page, Mobile layout. Use these as visual references before coding each page.

---

## 📋 STARTING PROMPT FOR ANTIGRAVITY

After pasting this entire document, follow up with:

```
Read the entire SpotTunes master prompt above.
Start with PHASE 1 — Foundation.

Before writing any code:
1. Activate the ui-ux-pro-max skill to generate the design system
2. Use the superpowers/brainstorming skill to plan the MongoDB schema and confirm no conflicts
3. Use Stitch MCP to generate a mockup of the main layout (sidebar + player bar + content area)

Then begin implementation, starting with:
1. next.config.ts (security headers, image domains)
2. tailwind.config.ts (custom design tokens)
3. lib/mongodb.ts (connection singleton)
4. All Mongoose models
5. lib/auth.ts (JWT helpers)
6. lib/ratelimit.ts (Upstash config)
7. lib/validations.ts (Zod schemas)

Ask me for my .env.local values before writing any environment-dependent code.
```

---

*Document version: 1.0 | Built for SpotTunes Personal Spotify Clone | Next.js 15 · MongoDB · YouTube API*
