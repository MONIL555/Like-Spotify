'use client';

import { usePlayerStore } from '@/store/playerStore';

export function useYouTubePlayer() {
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    shuffle,
    repeat,
    currentTime,
    duration,
    isLyricsOpen,
    isQueueOpen,
    isFullscreen,
    isPlayerReady,
    togglePlay,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleLyrics,
    toggleQueue,
    toggleFullscreen,
  } = usePlayerStore();

  const seekTo = (seconds: number) => {
    // Call the global seekTo exposed by YouTubeEmbed
    if (typeof window !== 'undefined' && (window as any).seekTo) {
      (window as any).seekTo(seconds);
    }
  };

  return {
    // State
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    shuffle,
    repeat,
    currentTime,
    duration,
    isLyricsOpen,
    isQueueOpen,
    isFullscreen,
    isPlayerReady,
    
    // Actions
    togglePlay,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleLyrics,
    toggleQueue,
    toggleFullscreen,
    seekTo,
  };
}
