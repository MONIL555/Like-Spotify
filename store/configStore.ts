import { create } from 'zustand';

interface ConfigState {
  phoneAuthEnabled: boolean;
  youtubeFallbackEnabled: boolean;
  isLoading: boolean;
  fetchConfig: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  phoneAuthEnabled: false, // Safe default — don't show until API confirms
  youtubeFallbackEnabled: true, // Safe default — allow playback until API says otherwise
  isLoading: true,
  fetchConfig: async () => {
    try {
      const res = await fetch('/api/config');
      const json = await res.json();
      if (json.success && json.data) {
        set({
          phoneAuthEnabled: json.data.phoneAuthEnabled,
          youtubeFallbackEnabled: json.data.youtubeFallbackEnabled,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch app config', error);
      set({ isLoading: false });
    }
  },
}));
