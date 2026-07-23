import { create } from 'zustand';

interface ConfigState {
  phoneAuthEnabled: boolean;
  youtubeFallbackEnabled: boolean;
  isLoading: boolean;
  fetchConfig: () => Promise<void>;
}

// Load from sessionStorage instantly (stale-while-revalidate pattern)
function getSessionCached(): { phoneAuthEnabled: boolean; youtubeFallbackEnabled: boolean } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('monistream-config');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

const sessionCached = typeof window !== 'undefined' ? getSessionCached() : null;

export const useConfigStore = create<ConfigState>((set) => ({
  phoneAuthEnabled: sessionCached?.phoneAuthEnabled ?? false,
  youtubeFallbackEnabled: sessionCached?.youtubeFallbackEnabled ?? true,
  isLoading: !sessionCached, // If we have cache, we're not "loading"
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
        // Persist to sessionStorage for next navigation
        try {
          sessionStorage.setItem('monistream-config', JSON.stringify(json.data));
        } catch { /* ignore */ }
      }
    } catch (error) {
      console.error('Failed to fetch app config', error);
      set({ isLoading: false });
    }
  },
}));
