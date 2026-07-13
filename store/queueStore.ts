// ============================================================
// SpotTunes — Queue Store (Zustand)
// ============================================================

'use client';

import { create } from 'zustand';
import type { Track } from '@/types';
import { shuffleArray } from '@/lib/utils';

interface QueueState {
  // State
  userQueue: Track[];    // manually added tracks
  queue: Track[];        // context upcoming tracks (playlist or autoplay)
  history: Track[];      // previously played tracks
  originalQueue: Track[];
  currentIndex: number;

  // Actions
  addToQueue: (track: Track, position?: 'next' | 'last') => void;
  addMultipleToQueue: (tracks: Track[]) => void;
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
  userQueue: [],
  queue: [],
  history: [],
  originalQueue: [],
  currentIndex: -1,

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
      // Otherwise remove from context queue
      const contextIndex = index - state.userQueue.length;
      return {
        queue: state.queue.filter((_, i) => i !== contextIndex),
      };
    }),

  reorderQueue: (from, to) =>
    set((state) => {
      // Reordering is tricky with two queues. For simplicity, we just combine them,
      // reorder, and put everything in userQueue except the original context queue.
      // But usually this isn't heavily used unless drag and drop is implemented.
      const newCombined = [...state.userQueue, ...state.queue];
      const [moved] = newCombined.splice(from, 1);
      newCombined.splice(to, 0, moved);
      return { 
        userQueue: newCombined,
        queue: [] // shift everything to userQueue for simplicity if reordered
      };
    }),

  clearQueue: () =>
    set({
      userQueue: [],
      queue: [],
      history: [],
      originalQueue: [],
      currentIndex: -1,
    }),

  playNext: (currentTrack) => {
    const { userQueue, queue } = get();
    
    // Determine the next track and which queue it came from
    let nextTrack: Track | null = null;
    let newUserQueue = [...userQueue];
    let newQueue = [...queue];

    if (newUserQueue.length > 0) {
      nextTrack = newUserQueue.shift() || null;
    } else if (newQueue.length > 0) {
      nextTrack = newQueue.shift() || null;
    }

    if (!nextTrack) return null;

    set((state) => ({
      userQueue: newUserQueue,
      queue: newQueue,
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
      // Put the previously current track (if any) back onto the context queue.
      // Since we don't have the current track here, we just use the queue state.
      // But for playPrevious, the prevTrack becomes the current track.
      // The current track should conceptually go back into the queue if we want, 
      // but usually we just prepend it to the context queue or user queue.
      // For simplicity, we put it in the context queue.
      queue: state.currentIndex >= 0 && state.originalQueue[state.currentIndex] ? [state.originalQueue[state.currentIndex], ...state.queue] : state.queue,
      currentIndex: Math.max(0, state.currentIndex - 1),
    }));

    return prevTrack;
  },

  loadPlaylist: (tracks, startIndex = 0) => {
    const currentTrack = tracks[startIndex] || null;
    // Queue is everything AFTER the starting track
    const upcomingTracks = tracks.slice(startIndex + 1);
    
    set({
      userQueue: [], // clear user queue on new context load
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
