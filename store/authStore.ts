// ============================================================
// SpotTunes — Auth Store (Zustand)
// ============================================================

'use client';

import { create } from 'zustand';
import type { UserPublic } from '@/types';

interface AuthState {
  user: UserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: UserPublic | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  toggleLikedTrackId: (videoId: string, isLiked: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  toggleLikedTrackId: (videoId, isLiked) =>
    set((state) => {
      if (!state.user) return state;
      const likedTrackIds = state.user.likedTrackIds || [];
      const newLikedTrackIds = isLiked
        ? [...new Set([...likedTrackIds, videoId])]
        : likedTrackIds.filter((id) => id !== videoId);

      return {
        user: {
          ...state.user,
          likedTrackIds: newLikedTrackIds,
        },
      };
    }),
}));
