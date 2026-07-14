'use client';

import { YouTubeEmbed } from './YouTubeEmbed';
import { NativeAudioPlayer } from './NativeAudioPlayer';
import { PlayerBar } from './PlayerBar';
import { QueuePanel } from './QueuePanel';
import { LyricsPanel } from './LyricsPanel';
import { FullscreenPlayer } from './FullscreenPlayer';
import { usePlayerStore } from '@/store/playerStore';

export function Player() {
  const { currentTrack } = usePlayerStore();

  return (
    <>
      {/* 
        The YouTubeEmbed must ALWAYS be mounted to maintain background play, 
        wake locks, and state synchronization, even if no track is playing yet.
      */}
      <YouTubeEmbed />
      <NativeAudioPlayer />

      {/* Render the visible UI only if a track is active */}
      {currentTrack && (
        <>
          <PlayerBar />
          <QueuePanel />
          <LyricsPanel />
          <FullscreenPlayer />
        </>
      )}
    </>
  );
}
