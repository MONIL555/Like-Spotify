// ============================================================
// SpotTunes — Player Store (Zustand)
// ============================================================

'use client';

import { create } from 'zustand';
import type { Track, RepeatMode } from '@/types';

interface PlayerState {
  // State
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  currentTime: number;
  duration: number;
  isLyricsOpen: boolean;
  isQueueOpen: boolean;
  isFullscreen: boolean;
  contextPlaylistId: string | null;
  isPlayerReady: boolean;

  // Actions
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
  setPlayerReady: (ready: boolean) => void;
  reset: () => void;
}

const initialState = {
  currentTrack: null,
  isPlaying: false,
  volume: 100,
  isMuted: false,
  shuffle: false,
  repeat: 'off' as RepeatMode,
  currentTime: 0,
  duration: 0,
  isLyricsOpen: false,
  isQueueOpen: false,
  isFullscreen: false,
  contextPlaylistId: null,
  isPlayerReady: false,
};

export const usePlayerStore = create<PlayerState>((set) => ({
  ...initialState,

  setCurrentTrack: (track) =>
    set({ currentTrack: track, currentTime: 0, duration: 0 }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),

  toggleMute: () =>
    set((state) => ({ isMuted: !state.isMuted })),

  toggleShuffle: () =>
    set((state) => ({ shuffle: !state.shuffle })),

  cycleRepeat: () =>
    set((state) => {
      const modes: RepeatMode[] = ['off', 'all', 'one'];
      const currentIndex = modes.indexOf(state.repeat);
      return { repeat: modes[(currentIndex + 1) % modes.length] };
    }),

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
}));
