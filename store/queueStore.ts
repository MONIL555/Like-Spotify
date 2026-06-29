// ============================================================
// SpotTunes — Queue Store (Zustand)
// ============================================================

'use client';

import { create } from 'zustand';
import type { Track } from '@/types';
import { shuffleArray } from '@/lib/utils';

interface QueueState {
  // State
  queue: Track[];        // upcoming tracks (not including current)
  history: Track[];      // previously played tracks
  originalQueue: Track[];
  currentIndex: number;

  // Actions
  addToQueue: (track: Track, position?: 'next' | 'last') => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  playNext: (currentTrack?: Track | null) => Track | null;
  playPrevious: () => Track | null;
  loadPlaylist: (tracks: Track[], startIndex?: number) => Track | null;
  shuffleQueue: () => void;
  restoreOriginalOrder: () => void;
  setCurrentIndex: (index: number) => void;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  queue: [],
  history: [],
  originalQueue: [],
  currentIndex: -1,

  addToQueue: (track, position = 'last') =>
    set((state) => {
      if (position === 'next') {
        return {
          queue: [track, ...state.queue],
        };
      }
      return {
        queue: [...state.queue, track],
      };
    }),

  removeFromQueue: (index) =>
    set((state) => ({
      queue: state.queue.filter((_, i) => i !== index),
    })),

  reorderQueue: (from, to) =>
    set((state) => {
      const newQueue = [...state.queue];
      const [moved] = newQueue.splice(from, 1);
      newQueue.splice(to, 0, moved);
      return { queue: newQueue };
    }),

  clearQueue: () =>
    set({
      queue: [],
      history: [],
      originalQueue: [],
      currentIndex: -1,
    }),

  playNext: (currentTrack) => {
    const { queue } = get();
    if (queue.length === 0) return null;

    const nextTrack = queue[0];

    set((state) => ({
      queue: state.queue.slice(1),
      // Push the currently-playing track into history (if provided)
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
      queue: prevTrack ? [prevTrack, ...state.queue] : state.queue,
      currentIndex: Math.max(0, state.currentIndex - 1),
    }));

    return prevTrack;
  },

  loadPlaylist: (tracks, startIndex = 0) => {
    const currentTrack = tracks[startIndex] || null;
    // Queue is everything AFTER the starting track
    const upcomingTracks = tracks.slice(startIndex + 1);
    
    set({
      queue: upcomingTracks,
      originalQueue: [...tracks],
      history: tracks.slice(0, startIndex),
      currentIndex: startIndex,
    });

    return currentTrack;
  },

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
}));
