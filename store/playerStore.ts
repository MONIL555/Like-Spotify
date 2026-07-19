// ============================================================
// MoniStream — Player Store (Zustand)
// ============================================================

'use client';

import { create } from 'zustand';
import type { Track, RepeatMode } from '@/types';
import { useQueueStore } from './queueStore';
import { useAuthStore } from './authStore';
import { useConfigStore } from './configStore';
import { toast } from 'sonner';

interface PlayerState {
  // State
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  isLyricsOpen: boolean;
  isQueueOpen: boolean;
  isFullscreen: boolean;
  contextPlaylistId: string | null;
  isPlayerReady: boolean;
  activePlayer: 'native' | 'youtube'; // New
  isFetchingMix: boolean;

  // Actions
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  toggleLyrics: () => void;
  toggleQueue: () => void;
  toggleFullscreen: () => void;
  setContextPlaylistId: (id: string | null) => void;
  setPlayerReady: (ready: boolean) => void;
  setActivePlayer: (player: 'native' | 'youtube') => void;
  reset: () => void;
  advanceToNext: () => Promise<void>;
  fetchMixForTrack: (track: Track) => Promise<void>;
}

const initialState = {
  currentTrack: null,
  isPlaying: false,
  volume: 100,
  isMuted: false,
  currentTime: 0,
  duration: 0,
  isLyricsOpen: false,
  isQueueOpen: false,
  isFullscreen: false,
  contextPlaylistId: null,
  isPlayerReady: false,
  activePlayer: 'youtube' as const,
  isFetchingMix: false,
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  ...initialState,

  setActivePlayer: (player) => set({ activePlayer: player }),

  setCurrentTrack: (track) => {
    if (!track) {
      set({ currentTrack: null, currentTime: 0, duration: 0, isPlaying: false, activePlayer: 'youtube' });
      return;
    }

    let activePlayer: 'native' | 'youtube' = 'youtube';
    if (track.streamUrl || track.saavnId || (track.source && (track.source.endsWith('_cached') || track.source === 'admin_manual'))) {
      activePlayer = 'native';
    }

    // Check Feature Flag for YouTube Fallback
    if (activePlayer === 'youtube') {
      const { youtubeFallbackEnabled } = useConfigStore.getState();
      if (!youtubeFallbackEnabled) {
        toast.error(`Cannot play "${track.title}" - YouTube streaming is disabled by admin.`);
        
        // Use a timeout to avoid deep recursion if many tracks are skipped in a row
        setTimeout(() => {
          get().advanceToNext();
        }, 1000);
        
        return; // Don't set the track
      }
    }

    set({ currentTrack: track, currentTime: 0, duration: 0, isPlaying: !!track, activePlayer });
  },

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),

  toggleMute: () =>
    set((state) => ({ isMuted: !state.isMuted })),

  setCurrentTime: (time) => set({ currentTime: time }),

  setDuration: (duration) => set({ duration }),

  toggleLyrics: () =>
    set((state) => ({
      isLyricsOpen: !state.isLyricsOpen,
      isQueueOpen: state.isLyricsOpen ? state.isQueueOpen : false,
    })),

  toggleQueue: () =>
    set((state) => ({
      isQueueOpen: !state.isQueueOpen,
      isLyricsOpen: state.isQueueOpen ? state.isLyricsOpen : false,
    })),

  toggleFullscreen: () =>
    set((state) => ({ isFullscreen: !state.isFullscreen })),

  setContextPlaylistId: (id) => set({ contextPlaylistId: id }),

  setPlayerReady: (ready) => set({ isPlayerReady: ready }),

  reset: () => set(initialState),

  /**
   * Fetch a mix for the given track and populate the autoplay queue.
   * Called immediately when a single song starts playing, and again
   * when the autoplay queue runs low during playback (infinite radio).
   */
  fetchMixForTrack: async (track: Track) => {
    const { isFetchingMix } = get();
    if (isFetchingMix) return; // prevent concurrent fetches

    const user = useAuthStore.getState().user as any;
    const autoplayEnabled = user?.preferences?.autoplay !== false;
    if (!autoplayEnabled) return;

    set({ isFetchingMix: true });

    try {
      const skipIds = useQueueStore.getState().getPlayedVideoIds();
      // To prevent extremely long URLs in endless radio mode, take the last 50 skip IDs
      const recentSkipIds = skipIds.slice(-50);
      const skipParam = recentSkipIds.length > 0 ? `&skipVideoIds=${recentSkipIds.join(',')}` : '';
      
      console.log(`[Autoplay] Fetching mix for: ${track.title}...`);
      const res = await fetch(
        `/api/autoplay?videoId=${track.videoId}&artist=${encodeURIComponent(track.artist || '')}&title=${encodeURIComponent(track.title || '')}${skipParam}`
      );
      const data = await res.json();

      if (data.playlist && data.playlist.length > 0) {
        // Filter out the currently playing track and any already in queue
        const currentVideoId = get().currentTrack?.videoId;
        const existingIds = new Set([
          ...useQueueStore.getState().autoplayQueue.map(t => t.videoId),
          ...useQueueStore.getState().userQueue.map(t => t.videoId),
          ...skipIds,
          ...(currentVideoId ? [currentVideoId] : []),
        ]);

        const newTracks = data.playlist.filter(
          (t: any) => !existingIds.has(t.videoId)
        );

        if (newTracks.length > 0) {
          useQueueStore.getState().appendAutoplayQueue(newTracks);
          console.log(`[Autoplay] Added ${newTracks.length} tracks to mix queue`);
        }
      }
    } catch (err) {
      console.error('[Autoplay] Failed to fetch mix tracks', err);
    } finally {
      set({ isFetchingMix: false });
    }
  },

  advanceToNext: async () => {
    const { currentTrack, setCurrentTrack, setIsPlaying, fetchMixForTrack } = get();
    const queueState = useQueueStore.getState();
    let next = queueState.playNext(currentTrack);

    // If no next track, attempt autoplay if source is 'single'
    if (!next && currentTrack) {
      const { playbackSource } = useQueueStore.getState();

      if (playbackSource === 'single') {
        // Source is single — try to fetch more mix tracks
        const user = useAuthStore.getState().user as any;
        const autoplayEnabled = user?.preferences?.autoplay !== false;

        if (autoplayEnabled) {
          try {
            console.log(`[Autoplay] Queue empty, fetching more mix for: ${currentTrack.title}...`);
            await fetchMixForTrack(currentTrack);
            // Try again after fetching
            next = useQueueStore.getState().playNext(null);
          } catch (err) {
            console.error('[Autoplay] Failed to fetch next tracks', err);
          }
        }
      }
      // If source is 'playlist', we do NOT autoplay — playlist ends naturally
    }

    if (next) {
      setCurrentTrack(next);
      setTimeout(() => setIsPlaying(true), 50);

      // Pre-fetch next batch if autoplay queue is running low (< 3 tracks)
      const { autoplayQueue, playbackSource } = useQueueStore.getState();
      if (playbackSource === 'single' && autoplayQueue.length < 3) {
        // Fetch more mix tracks in the background using the new current track
        fetchMixForTrack(next);
      }
    } else {
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  },
}));
