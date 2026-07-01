// ============================================================
// SpotTunes — YouTubeEmbed (Hidden Iframe)
// ============================================================

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { useQueueStore } from '@/store/queueStore';

// We will generate a continuous silent audio stream using Web Audio API instead of a base64 string
// to avoid loop gaps that could cause mobile OS to suspend the background process.

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
  const wakeLockRef = useRef<any>(null);

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
        const res = await fetch(`/api/autoplay?videoId=${currentTrackNow.videoId}&artist=${encodeURIComponent(currentTrackNow.artist)}`);
        const data = await res.json();
        if (data.playlist && data.playlist.length > 0) {
          useQueueStore.setState((state) => ({ queue: [...state.queue, ...data.playlist] }));
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
            console.error('YouTube Player Error:', event.data, 'for track:', usePlayerStore.getState().currentTrack);
            // Wait 1 second before advancing to prevent infinite crash loops
            setTimeout(() => {
              advanceToNext();
            }, 1000);
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
      if (!currentTrack.videoId || currentTrack.videoId.length < 11) {
        console.error('Invalid videoId passed to player:', currentTrack);
        advanceToNext();
        return;
      }
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

  // Expose global method to seek (used by ProgressBar) and manage silent audio synchronously
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).seekTo = (seconds: number) => {
        if (playerRef.current) {
          playerRef.current.seekTo(seconds, true);
        }
      };
      
      // Global methods to play/pause silent audio directly on user interaction
      (window as any).playSilentAudio = () => {
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log('Silent audio play failed:', e));
        }
        if (playerRef.current) {
          // Play synchronously to satisfy mobile user-gesture requirements
          playerRef.current.playVideo();
        }
      };
      
      (window as any).pauseSilentAudio = () => {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        if (playerRef.current) {
          playerRef.current.pauseVideo();
        }
      };
    }
  }, []);

  // Setup continuous silent audio stream
  useEffect(() => {
    if (!audioRef.current) return;
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const oscillator = ctx.createOscillator();
        const dst = ctx.createMediaStreamDestination();
        oscillator.connect(dst);
        oscillator.start();
        
        audioRef.current.srcObject = dst.stream;
      }
    } catch (e) {
      console.log('Web audio silent stream failed', e);
    }
  }, []);

  // Background Keep-Alive & Media Session
  useEffect(() => {
    // Play/pause the silent audio to keep the session alive on mobile
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log('Keep-alive audio failed:', e));
        
        // Request wake lock if supported to prevent device from sleeping
        if ('wakeLock' in navigator) {
          (navigator as any).wakeLock.request('screen')
            .then((lock: any) => { wakeLockRef.current = lock; })
            .catch((e: any) => console.log('Wake Lock failed:', e));
        }
      } else {
        audioRef.current.pause();
        
        // Release wake lock
        if (wakeLockRef.current) {
          wakeLockRef.current.release()
            .then(() => { wakeLockRef.current = null; })
            .catch(() => {});
        }
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
      
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      navigator.mediaSession.setActionHandler('play', () => {
        if (audioRef.current) audioRef.current.play().catch(()=>{});
        if (playerRef.current) playerRef.current.playVideo();
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (audioRef.current) audioRef.current.pause();
        if (playerRef.current) playerRef.current.pauseVideo();
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (audioRef.current) audioRef.current.play().catch(()=>{});
        const prevTrack = playPrevious();
        if (prevTrack) {
          setCurrentTrack(prevTrack);
        }
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (audioRef.current) audioRef.current.play().catch(()=>{});
        advanceToNext();
      });
    }
  }, [isPlaying, currentTrack, playNext, playPrevious, setCurrentTrack, setIsPlaying, advanceToNext]);

  return (
    <div
      className="fixed pointer-events-none opacity-[0.01] z-[-1]"
      style={{ width: '10px', height: '10px', top: '0', left: '0', overflow: 'hidden' }}
    >
      <div ref={containerRef} id="youtube-player" />
      <audio 
        ref={audioRef} 
        loop 
        playsInline 
      />
    </div>
  );
}
