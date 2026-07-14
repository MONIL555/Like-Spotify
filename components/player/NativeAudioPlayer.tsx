'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { useQueueStore } from '@/store/queueStore';

export function NativeAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    activePlayer,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setCurrentTrack,
    advanceToNext,
    setPlayerReady,
  } = usePlayerStore();

  const { playNext, playPrevious } = useQueueStore();
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  const isActive = activePlayer === 'native' && currentTrack;

  // 1. Fetch Stream URL if needed
  useEffect(() => {
    if (!isActive) {
      setStreamUrl(null);
      return;
    }

    if (currentTrack.streamUrl) {
      setStreamUrl(currentTrack.streamUrl);
      return;
    }

    if (currentTrack.saavnId) {
      // Fetch stream dynamically
      fetch(`/api/tracks/${currentTrack.saavnId}/stream`)
        .then(res => res.json())
        .then(data => {
          if (data.streamUrl) {
            setStreamUrl(data.streamUrl);
          } else {
            // Fallback to youtube active player if stream fetch fails
            usePlayerStore.getState().setActivePlayer('youtube');
          }
        })
        .catch(() => {
          usePlayerStore.getState().setActivePlayer('youtube');
        });
    }
  }, [currentTrack, isActive]);

  // 2. Sync Play/Pause State
  useEffect(() => {
    if (!audioRef.current || !isActive || !streamUrl) return;

    if (isPlaying) {
      audioRef.current.play().catch(e => console.error('Native Audio Play Error:', e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, isActive, streamUrl]);

  // 3. Sync Volume
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);

  // 4. Global Expose for Seek and Sync Play (TrackRow.tsx)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // We merge these with YouTube's globally exposed functions
    const originalSeekTo = (window as any).seekTo;
    (window as any).seekTo = (seconds: number) => {
      if (usePlayerStore.getState().activePlayer === 'native' && audioRef.current) {
        audioRef.current.currentTime = seconds;
      } else if (originalSeekTo) {
        originalSeekTo(seconds);
      }
    };
  }, []);

  // 5. Media Session (Lockscreen controls)
  useEffect(() => {
    if (!isActive || !currentTrack || !('mediaSession' in navigator)) return;

    const art = currentTrack.thumbnails?.high || currentTrack.thumbnails?.default;
    const artwork = art ? [{ src: art, sizes: '512x512', type: 'image/jpeg' }] : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title || 'Unknown Title',
      artist: currentTrack.artist || 'Unknown Artist',
      album: currentTrack.albumName || 'Unknown Album',
      artwork,
    });

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    navigator.mediaSession.setActionHandler('play', () => {
      audioRef.current?.play();
      setIsPlaying(true);
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause();
      setIsPlaying(false);
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      const prev = playPrevious();
      if (prev) setCurrentTrack(prev);
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      advanceToNext();
    });
  }, [isActive, isPlaying, currentTrack, playPrevious, advanceToNext, setCurrentTrack, setIsPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current && isActive) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && isActive) {
      setDuration(audioRef.current.duration);
      setPlayerReady(true);
      if (isPlaying) {
         audioRef.current.play().catch(() => {});
      }
    }
  };

  const handleEnded = () => {
    if (isActive) {
      advanceToNext();
    }
  };

  const handleError = () => {
    if (isActive) {
      console.error('Native Audio Player Error, falling back to YouTube');
      usePlayerStore.getState().setActivePlayer('youtube');
    }
  };

  if (!isActive || !streamUrl) return null;

  return (
    <audio
      ref={audioRef}
      src={streamUrl}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onEnded={handleEnded}
      onError={handleError}
      className="hidden"
      autoPlay={isPlaying}
    />
  );
}
