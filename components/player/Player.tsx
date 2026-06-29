'use client';

import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { NowPlayingBar } from './NowPlayingBar';
import { PlayerControls } from './PlayerControls';
import { ProgressBar } from './ProgressBar';
import { VolumeControl } from './VolumeControl';
import { YouTubeEmbed } from './YouTubeEmbed';
import { FullscreenPlayer } from './FullscreenPlayer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LyricsPanel } from './LyricsPanel';

export function Player() {
  const { currentTrack, isFullscreen, isLyricsOpen, toggleLyrics } = useYouTubePlayer();
  const { user } = useAuth();
  
  // Register global keyboard shortcuts
  useKeyboardShortcuts();

  // Record listening history
  useEffect(() => {
    if (currentTrack && user) {
      fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: currentTrack.videoId,
          duration: currentTrack.duration,
          source: 'queue',
          trackData: currentTrack,
        }),
      }).catch(err => console.error('Failed to log history', err));
    }
  }, [currentTrack?.videoId, user]);

  // Determine if player should be visible at all
  // In a real app, you might want to show it empty, but for now we'll slide it in
  // when a track is first played.
  
  return (
    <>
      <YouTubeEmbed />
      
      {/* Floating glass bottom player bar */}
      <footer 
        className={cn(
          "fixed bottom-[64px] md:bottom-2 left-2 right-2 md:left-[208px] lg:left-[248px] h-[72px] glass-panel-heavy rounded-2xl flex items-center justify-between px-4 z-[60] transition-all duration-500 ease-out shadow-glass",
          !currentTrack ? "translate-y-[150%] opacity-0" : "translate-y-0 opacity-100"
        )}
      >
        <NowPlayingBar />
        
        <div className="flex-1 max-w-[722px] flex flex-col items-center justify-center px-4">
          <PlayerControls />
          <ProgressBar />
        </div>
        
        <VolumeControl />
      </footer>

      {/* Fullscreen takeover modal */}
      {isFullscreen && <FullscreenPlayer />}

      {/* Lyrics sliding panel */}
      <LyricsPanel isOpen={isLyricsOpen} onClose={toggleLyrics} />
    </>
  );
}
