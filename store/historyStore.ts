'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Track } from '@/types';

interface HistoryState {
  recentlyPlayed: Track[];
  addToHistory: (track: Track) => void;
  removeFromHistory: (videoId: string) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      recentlyPlayed: [],
      addToHistory: (track) => set((state) => {
        // Only add songs belonging to JioSaavn or cached sources (no YouTube)
        const isJioSaavn = track.source === 'jiosaavn' || !!track.saavnId;
        const isCached = track.source?.includes('cached');
        
        if (!isJioSaavn && !isCached) {
          return state;
        }

        // Remove it if it already exists to put it at the front (most recent first)
        const filtered = state.recentlyPlayed.filter((t) => t.videoId !== track.videoId);
        return {
          recentlyPlayed: [track, ...filtered].slice(0, 50), // Keep up to 50 tracks in cache
        };
      }),
      removeFromHistory: (videoId) => set((state) => ({
        recentlyPlayed: state.recentlyPlayed.filter((t) => t.videoId !== videoId),
      })),
      clearHistory: () => set({ recentlyPlayed: [] }),
    }),
    {
      name: 'spottunes-history-storage',
    }
  )
);
