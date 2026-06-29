// ============================================================
// SpotTunes — YouTubeEmbed (Hidden Iframe)
// ============================================================

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { useQueueStore } from '@/store/queueStore';

// Tiny 1-second silent WAV base64
const SILENT_AUDIO = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export function YouTubeEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isApiReady, setIsApiReady] = useState(false);
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

  // Helper to advance to next track (used on end + error)
  const advanceToNext = useCallback(async () => {
    const currentTrackNow = usePlayerStore.getState().currentTrack;
    let nextTrack = playNext(currentTrackNow);
    
    if (nextTrack) {
      setCurrentTrack(nextTrack);
    } else if (currentTrackNow) {
      // Dynamic mix (autoplay) when queue runs out
      try {
        const res = await fetch(`/api/autoplay?videoId=${currentTrackNow.videoId}&title=${encodeURIComponent(currentTrackNow.title)}&artist=${encodeURIComponent(currentTrackNow.artist)}`);
        const data = await res.json();
        if (data.track) {
          useQueueStore.getState().addToQueue(data.track, 'next');
          const finalNext = playNext(currentTrackNow);
          if (finalNext) {
            setCurrentTrack(finalNext);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch autoplay track', err);
      }
      
      setCurrentTrack(null);
      setIsPlaying(false);
    } else {
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  }, [playNext, setCurrentTrack, setIsPlaying]);

  // 1. Load YouTube Iframe API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setIsApiReady(true);
      };
    } else {
      setIsApiReady(true);
    }
  }, []);

  // 2. Initialize Player Instance
  useEffect(() => {
    if (isApiReady && !playerRef.current && containerRef.current) {
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '100',
        width: '100',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            setPlayerReady(true);
            // Apply initial volume
            if (isMuted) {
              event.target.mute();
            } else {
              event.target.setVolume(volume);
            }
          },
          onStateChange: (event: any) => {
            const state = event.data;
            const YT = window.YT;
            
            if (state === YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setDuration(event.target.getDuration());
            } else if (
              state === YT.PlayerState.PAUSED ||
              state === YT.PlayerState.CUED
            ) {
              setIsPlaying(false);
            } else if (state === YT.PlayerState.ENDED) {
              setIsPlaying(false);
              advanceToNext(); // Auto-play next track in queue
            }
          },
          onError: (event: any) => {
            console.error('YouTube Player Error:', event.data);
            advanceToNext(); // Skip unplayable tracks
          },
        },
      });
    }

    return () => {
      // Cleanup player on unmount
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
        setPlayerReady(false);
      }
    };
  }, [isApiReady, setPlayerReady, setIsPlaying, advanceToNext, setDuration]);

  // 3. Handle Track Change
  useEffect(() => {
    if (playerRef.current && currentTrack) {
      playerRef.current.loadVideoById(currentTrack.videoId);
      if (!isPlaying) {
        setIsPlaying(true);
      }
    } else if (playerRef.current && !currentTrack) {
      playerRef.current.stopVideo();
      setIsPlaying(false);
    }
  }, [currentTrack?.videoId]); // Only run when videoId changes

  // 4. Handle Play/Pause Toggle
  useEffect(() => {
    if (playerRef.current && currentTrack) {
      const state = playerRef.current.getPlayerState();
      const YT = window.YT;

      if (isPlaying && state !== YT.PlayerState.PLAYING) {
        playerRef.current.playVideo();
      } else if (!isPlaying && state === YT.PlayerState.PLAYING) {
        playerRef.current.pauseVideo();
      }
    }
  }, [isPlaying, currentTrack]);

  // 5. Handle Volume & Mute Changes
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume);
      if (isMuted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
      }
    }
  }, [volume, isMuted]);

  // 6. Time Tracking Loop
  useEffect(() => {
    let animationFrameId: number;

    const updateTime = () => {
      if (
        isPlaying &&
        playerRef.current &&
        playerRef.current.getCurrentTime
      ) {
        setCurrentTime(playerRef.current.getCurrentTime());
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

  // Expose global method to seek (used by ProgressBar)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).seekTo = (seconds: number) => {
        if (playerRef.current) {
          playerRef.current.seekTo(seconds, true);
        }
      };
    }
  }, []);

  // Background Keep-Alive & Media Session
  useEffect(() => {
    // Play/pause the silent audio to keep the session alive on mobile
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log('Keep-alive audio failed:', e));
      } else {
        audioRef.current.pause();
      }
    }

    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.albumName || 'Unknown Album',
        artwork: [
          { src: currentTrack.thumbnails?.high || currentTrack.thumbnails?.default || '', sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        const prevTrack = playPrevious();
        if (prevTrack) setCurrentTrack(prevTrack);
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        const nextTrack = playNext(currentTrack);
        if (nextTrack) {
          setCurrentTrack(nextTrack);
        } else {
          setCurrentTrack(null);
          setIsPlaying(false);
        }
      });
    }
  }, [isPlaying, currentTrack, playNext, playPrevious, setCurrentTrack, setIsPlaying]);

  return (
    <div
      className="fixed bottom-0 right-0 pointer-events-none opacity-0 invisible"
      style={{ width: '10px', height: '10px', overflow: 'hidden' }}
    >
      <div ref={containerRef} id="youtube-player" />
      <audio 
        ref={audioRef} 
        src={SILENT_AUDIO} 
        loop 
        playsInline 
      />
    </div>
  );
}
