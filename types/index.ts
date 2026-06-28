// ============================================================
// SoundWave — Shared TypeScript Types
// ============================================================

// ─── Track ───────────────────────────────────────────────────

export interface TrackThumbnails {
  default?: string;
  medium?: string;
  high?: string;
  maxres?: string;
}

export interface Track {
  _id?: string;
  videoId: string;
  title: string;
  artist: string;
  channelId: string;
  channelTitle?: string;
  albumName?: string;
  thumbnails: TrackThumbnails;
  duration: number; // seconds
  durationText: string; // "3:45"
  publishedAt?: string;
  tags?: string[];
  genre?: string;
  playCount: number;
  likeCount: number;
  cachedAt?: string;
}

// ─── Playlist ────────────────────────────────────────────────

export interface PlaylistTrack {
  videoId: string;
  addedBy?: string;
  addedAt: string;
  position: number;
}

export interface Playlist {
  _id: string;
  name: string;
  description?: string;
  owner: string | UserPublic;
  collaborators: string[];
  tracks: PlaylistTrack[];
  isPublic: boolean;
  isCollaborative: boolean;
  coverImageUrl?: string;
  coverColor?: string;
  followedBy: string[];
  totalDuration: number;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── User ────────────────────────────────────────────────────

export interface UserPublic {
  _id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  avatarColor: string;
  plan: 'free' | 'premium';
  isActive: boolean;
  followers: string[];
  following: string[];
  likedTrackIds: string[];
  savedAlbumIds: string[];
  followedArtistIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserWithPreferences extends UserPublic {
  preferences?: UserPreferences;
}

// ─── User Preferences ───────────────────────────────────────

export interface EQBands {
  hz60: number;
  hz230: number;
  hz910: number;
  hz4k: number;
  hz14k: number;
}

export interface UserPreferences {
  _id?: string;
  userId: string;
  eqPreset: string;
  eqBands: EQBands;
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

// ─── Playlist Folder ─────────────────────────────────────────

export interface PlaylistFolder {
  _id: string;
  name: string;
  owner: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Listening History ───────────────────────────────────────

export interface ListeningHistoryEntry {
  _id?: string;
  userId: string;
  videoId: string;
  listenedAt: string;
  duration: number;
  source: 'search' | 'playlist' | 'recommended' | 'album' | 'artist' | 'queue';
  contextId?: string;
}

// ─── Artist ──────────────────────────────────────────────────

export interface Artist {
  _id?: string;
  channelId: string;
  name: string;
  thumbnailUrl?: string;
  bannerUrl?: string;
  description?: string;
  subscriberCount?: number;
  videoCount?: number;
  cachedAt?: string;
}

// ─── Album ───────────────────────────────────────────────────

export interface Album {
  _id?: string;
  youtubePlaylistId: string;
  title: string;
  artist: string;
  channelId: string;
  coverUrl?: string;
  trackCount: number;
  publishedAt?: string;
  tracks: string[]; // video IDs
  cachedAt?: string;
}

// ─── Player State ────────────────────────────────────────────

export type RepeatMode = 'off' | 'one' | 'all';

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number; // 0-100
  isMuted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  currentTime: number; // seconds
  duration: number; // seconds
  isLyricsOpen: boolean;
  isQueueOpen: boolean;
  isFullscreen: boolean;
  contextPlaylistId: string | null;
}

export interface PlayerActions {
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  toggleLyrics: () => void;
  toggleQueue: () => void;
  toggleFullscreen: () => void;
  setContextPlaylistId: (id: string | null) => void;
}

// ─── Queue State ─────────────────────────────────────────────

export interface QueueState {
  queue: Track[];
  history: Track[];
  originalQueue: Track[];
  currentIndex: number;
}

export interface QueueActions {
  addToQueue: (track: Track, position?: 'next' | 'last') => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  playNext: () => Track | null;
  playPrevious: () => Track | null;
  loadPlaylist: (tracks: Track[], startIndex?: number) => void;
  shuffleQueue: () => void;
  restoreOriginalOrder: () => void;
}

// ─── Auth State ──────────────────────────────────────────────

export interface AuthState {
  user: UserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthActions {
  setUser: (user: UserPublic | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

// ─── Search ──────────────────────────────────────────────────

export type SearchType = 'track' | 'artist' | 'album' | 'playlist' | 'all';

export interface SearchResults {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
  nextPageToken?: string;
}

// ─── API Response ────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// ─── JWT ─────────────────────────────────────────────────────

export interface JWTPayload {
  userId: string;
  email: string;
  plan: 'free' | 'premium';
  iat?: number;
  exp?: number;
}

// ─── Lyrics ──────────────────────────────────────────────────

export interface Lyrics {
  syncedLyrics: string | null;
  plainLyrics: string | null;
  duration: number;
}

// ─── Genre ───────────────────────────────────────────────────

export interface Genre {
  slug: string;
  name: string;
  color: string;
  gradient: string;
  icon?: string;
}

// ─── Context Menu ────────────────────────────────────────────

export interface ContextMenuItem {
  label: string;
  icon?: string;
  action: () => void;
  divider?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

// ─── Library ─────────────────────────────────────────────────

export type LibraryFilter = 'all' | 'playlists' | 'albums' | 'artists';
export type LibrarySort = 'recents' | 'recently-added' | 'alphabetical' | 'creator';

export interface LibraryItem {
  id: string;
  type: 'playlist' | 'album' | 'artist' | 'liked-songs';
  name: string;
  subtitle: string;
  imageUrl?: string;
  imageShape: 'square' | 'circle';
  pinned?: boolean;
}
