// ============================================================
// MoniStream — Queue Store (Zustand)
// ============================================================

'use client';

import { create } from 'zustand';
import type { Track } from '@/types';
import { shuffleArray } from '@/lib/utils';

export type PlaybackSource = 'single' | 'playlist';

interface QueueState {
  // State
  userQueue: Track[];        // manually added tracks (highest priority)
  queue: Track[];            // context tracks from playlist (only used when source='playlist')
  autoplayQueue: Track[];    // generated mix tracks (only used when source='single')
  history: Track[];          // previously played tracks
  originalQueue: Track[];
  currentIndex: number;
  playbackSource: PlaybackSource;

  // Actions
  addToQueue: (track: Track, position?: 'next' | 'last') => void;
  addMultipleToQueue: (tracks: Track[]) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  playNext: (currentTrack?: Track | null) => Track | null;
  playPrevious: () => Track | null;
  loadPlaylist: (tracks: Track[], startIndex?: number, source?: PlaybackSource) => Track | null;
  loadSingle: (track: Track) => void;
  setAutoplayQueue: (tracks: Track[]) => void;
  appendAutoplayQueue: (tracks: Track[]) => void;
  clearAutoplay: () => void;
  shuffleQueue: () => void;
  restoreOriginalOrder: () => void;
  setCurrentIndex: (index: number) => void;
  getPlayedVideoIds: () => string[];
}

export const useQueueStore = create<QueueState>((set, get) => ({
  userQueue: [],
  queue: [],
  autoplayQueue: [],
  history: [],
  originalQueue: [],
  currentIndex: -1,
  playbackSource: 'single',

  addToQueue: (track, position = 'last') =>
    set((state) => {
      if (position === 'next') {
        return {
          userQueue: [track, ...state.userQueue],
        };
      }
      return {
        userQueue: [...state.userQueue, track],
      };
    }),

  addMultipleToQueue: (tracks) =>
    set((state) => ({
      queue: [...state.queue, ...tracks],
    })),

  removeFromQueue: (index) =>
    set((state) => {
      // First try to remove from userQueue
      if (index < state.userQueue.length) {
        return {
          userQueue: state.userQueue.filter((_, i) => i !== index),
        };
      }
      // Then from context queue (playlist)
      const contextIndex = index - state.userQueue.length;
      if (state.playbackSource === 'playlist' && contextIndex < state.queue.length) {
        return {
          queue: state.queue.filter((_, i) => i !== contextIndex),
        };
      }
      // Then from autoplay queue
      const autoIndex = contextIndex - (state.playbackSource === 'playlist' ? state.queue.length : 0);
      return {
        autoplayQueue: state.autoplayQueue.filter((_, i) => i !== autoIndex),
      };
    }),

  reorderQueue: (from, to) =>
    set((state) => {
      const newCombined = [...state.userQueue, ...state.queue];
      const [moved] = newCombined.splice(from, 1);
      newCombined.splice(to, 0, moved);
      return { 
        userQueue: newCombined,
        queue: []
      };
    }),

  clearQueue: () =>
    set({
      userQueue: [],
      queue: [],
      autoplayQueue: [],
      history: [],
      originalQueue: [],
      currentIndex: -1,
      playbackSource: 'single',
    }),

  /**
   * 3-tier playNext priority:
   * 1. userQueue (manually queued by user) — always first
   * 2. queue (playlist context tracks) — only when source='playlist'
   * 3. autoplayQueue (generated mix) — only when source='single'
   */
  playNext: (currentTrack) => {
    const { userQueue, queue, autoplayQueue, playbackSource } = get();
    
    let nextTrack: Track | null = null;
    let newUserQueue = [...userQueue];
    let newQueue = [...queue];
    let newAutoplayQueue = [...autoplayQueue];

    // Priority 1: User queue (always)
    if (newUserQueue.length > 0) {
      nextTrack = newUserQueue.shift() || null;
    }
    // Priority 2: Playlist context queue (only for playlist source)
    else if (playbackSource === 'playlist' && newQueue.length > 0) {
      nextTrack = newQueue.shift() || null;
    }
    // Priority 3: Autoplay mix queue (only for single source)
    else if (playbackSource === 'single' && newAutoplayQueue.length > 0) {
      nextTrack = newAutoplayQueue.shift() || null;
    }

    if (!nextTrack) return null;

    set((state) => ({
      userQueue: newUserQueue,
      queue: newQueue,
      autoplayQueue: newAutoplayQueue,
      history: currentTrack
        ? [...state.history, currentTrack]
        : state.history,
      currentIndex: state.currentIndex + 1,
    }));

    return nextTrack;
  },

  playPrevious: () => {
    const { history } = get();
    if (history.length === 0) return null;

    const prevTrack = history[history.length - 1];

    set((state) => ({
      history: state.history.slice(0, -1),
      queue: state.currentIndex >= 0 && state.originalQueue[state.currentIndex] ? [state.originalQueue[state.currentIndex], ...state.queue] : state.queue,
      currentIndex: Math.max(0, state.currentIndex - 1),
    }));

    return prevTrack;
  },

  /**
   * Load a playlist context. Used for user playlists, liked songs, yt-playlists.
   * When source='playlist', autoplay is disabled — queue plays in order then stops.
   * When source='single' (default), the queue is just the track list for immediate use.
   */
  loadPlaylist: (tracks, startIndex = 0, source = 'playlist') => {
    const currentTrack = tracks[startIndex] || null;
    const upcomingTracks = tracks.slice(startIndex + 1);
    
    set({
      userQueue: [],       // clear user queue on new context load
      queue: upcomingTracks,
      autoplayQueue: [],   // clear any old mix
      originalQueue: [...tracks],
      history: tracks.slice(0, startIndex),
      currentIndex: startIndex,
      playbackSource: source,
    });

    return currentTrack;
  },

  /**
   * Play a single track (from search, home, trending, etc.).
   * Clears context queue, sets source='single', so autoplay mix kicks in.
   */
  loadSingle: (track) => {
    set((state) => ({
      userQueue: state.userQueue,  // preserve user queue
      queue: [],                   // no playlist context
      autoplayQueue: [],           // will be populated by autoplay fetch
      originalQueue: [track],
      history: state.history,      // preserve history for back navigation
      currentIndex: 0,
      playbackSource: 'single',
    }));
  },

  setAutoplayQueue: (tracks) =>
    set({ autoplayQueue: tracks }),

  appendAutoplayQueue: (tracks) =>
    set((state) => ({
      autoplayQueue: [...state.autoplayQueue, ...tracks],
    })),

  clearAutoplay: () =>
    set({ autoplayQueue: [] }),

  shuffleQueue: () =>
    set((state) => ({
      originalQueue:
        state.originalQueue.length === 0
          ? [...state.queue]
          : state.originalQueue,
      queue: shuffleArray(state.queue),
    })),

  restoreOriginalOrder: () =>
    set((state) => ({
      queue: state.originalQueue.slice(state.currentIndex + 1),
    })),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  /**
   * Get all videoIds that have been played or are queued.
   * Used to pass as skipVideoIds to the autoplay API to avoid repeats.
   * Includes: history, autoplayQueue, context queue, and userQueue.
   */
  getPlayedVideoIds: () => {
    const { history, autoplayQueue, queue, userQueue } = get();
    const ids = new Set<string>();
    history.forEach(t => ids.add(t.videoId));
    autoplayQueue.forEach(t => ids.add(t.videoId));
    queue.forEach(t => ids.add(t.videoId));
    userQueue.forEach(t => ids.add(t.videoId));
    return Array.from(ids);
  },
}));
