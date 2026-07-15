// ============================================================
// SpotTunes — Player Store (Zustand)
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
    if (track.streamUrl || track.saavnId) {
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

  advanceToNext: async () => {
    const { currentTrack, setCurrentTrack, setIsPlaying } = get();
    let next = useQueueStore.getState().playNext(currentTrack);

    // AUTOPLAY LOGIC
    if (!next && currentTrack) {
      const user = useAuthStore.getState().user as any;
      const autoplayEnabled = user?.preferences?.autoplay !== false;

      if (autoplayEnabled) {
        try {
          console.log(`[Autoplay] Queue empty, fetching mix for: ${currentTrack.title}...`);
          const res = await fetch(`/api/autoplay?videoId=${currentTrack.videoId}&artist=${encodeURIComponent(currentTrack.artist || '')}&title=${encodeURIComponent(currentTrack.title || '')}`);
          const data = await res.json();
          if (data.playlist && data.playlist.length > 0) {
            useQueueStore.getState().addMultipleToQueue(data.playlist);
            next = useQueueStore.getState().playNext(null);
          }
        } catch (err) {
          console.error('[Autoplay] Failed to fetch next tracks', err);
        }
      }
    }

    if (next) {
      setCurrentTrack(next);
      // Wait a tick to ensure state is updated before iframe plays
      setTimeout(() => setIsPlaying(true), 50);
    } else {
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  },
}));
