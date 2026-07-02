'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { useQueueStore } from '@/store/queueStore';

export function YouTubeEmbed() {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    setPlayerReady,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setCurrentTrack,
  } = usePlayerStore();

  const { playNext, playPrevious } = useQueueStore();

  const advanceToNext = useCallback(() => {
    const currentTrackNow = usePlayerStore.getState().currentTrack;
    let nextTrack = playNext(currentTrackNow);
    
    if (nextTrack) {
      setCurrentTrack(nextTrack);
    } else {
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  }, [playNext, setCurrentTrack, setIsPlaying]);

  useEffect(() => {
    setPlayerReady(true);
  }, [setPlayerReady]);

  // Handle Track Change
  useEffect(() => {
    if (audioRef.current) {
      if (currentTrack && currentTrack.videoId) {
        audioRef.current.src = `/api/stream?videoId=${currentTrack.videoId}`;
        audioRef.current.load();
        if (isPlaying) {
          audioRef.current.play().catch(e => console.error('Audio play error:', e));
        }
      } else {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
        setIsPlaying(false);
      }
    }
  }, [currentTrack?.videoId]); // Run on track change

  // Handle Play/Pause
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      if (isPlaying && audioRef.current.paused) {
        audioRef.current.play().catch(e => {
          console.error('Audio play error:', e);
          setIsPlaying(false);
        });
      } else if (!isPlaying && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  // Handle Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Handle Audio Events
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const handleDurationChange = () => setDuration(audioEl.duration);
    const handleEnded = () => advanceToNext();
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = (e: any) => {
      console.error('Native Audio Error:', e);
      setTimeout(advanceToNext, 1000);
    };

    audioEl.addEventListener('durationchange', handleDurationChange);
    audioEl.addEventListener('ended', handleEnded);
    audioEl.addEventListener('play', handlePlay);
    audioEl.addEventListener('pause', handlePause);
    audioEl.addEventListener('error', handleError);

    return () => {
      audioEl.removeEventListener('durationchange', handleDurationChange);
      audioEl.removeEventListener('ended', handleEnded);
      audioEl.removeEventListener('play', handlePlay);
      audioEl.removeEventListener('pause', handlePause);
      audioEl.removeEventListener('error', handleError);
    };
  }, [setDuration, advanceToNext, setIsPlaying]);

  // Smooth Time Tracking for Progress Bar
  useEffect(() => {
    let animationFrameId: number;
    const updateTime = () => {
      if (isPlaying && audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
      animationFrameId = requestAnimationFrame(updateTime);
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(updateTime);
    }
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, setCurrentTime]);

  // Expose global method to seek
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).seekTo = (seconds: number) => {
        if (audioRef.current) {
          audioRef.current.currentTime = seconds;
        }
      };
      
      (window as any).playVideoSync = () => {
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log('Sync play failed:', e));
        }
      };
    }
  }, []);

  // Media Session for Lock Screen Controls
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      const artworkSrc = currentTrack.thumbnails?.high || currentTrack.thumbnails?.default;
      const artwork = artworkSrc ? [{ src: artworkSrc, sizes: '512x512', type: 'image/jpeg' }] : [];

      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title || 'Unknown Title',
          artist: currentTrack.artist || 'Unknown Artist',
          album: currentTrack.albumName || 'Unknown Album',
          artwork: artwork,
        });
      } catch (e) {
        console.error('Failed to set MediaMetadata:', e);
      }
      
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      navigator.mediaSession.setActionHandler('play', () => {
        if (audioRef.current) audioRef.current.play().catch(()=>{});
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        const prevTrack = playPrevious();
        if (prevTrack) {
          setCurrentTrack(prevTrack);
        }
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        advanceToNext();
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (audioRef.current && details.seekTime) {
          audioRef.current.currentTime = details.seekTime;
        }
      });
    }
  }, [isPlaying, currentTrack, playNext, playPrevious, setCurrentTrack, setIsPlaying, advanceToNext]);

  return (
    <div
      className="fixed pointer-events-none opacity-[0.01] z-[-1]"
      style={{ width: '10px', height: '10px', top: '0', left: '0', overflow: 'hidden' }}
    >
      <audio 
        ref={audioRef} 
        playsInline 
        autoPlay
        preload="auto"
      />
    </div>
  );
}
