'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { useQueueStore } from '@/store/queueStore';
import { useHistoryStore } from '@/store/historyStore';

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
  const silentAudioRef = useRef<HTMLAudioElement>(null);
  const wakeLockRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

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
    advanceToNext,
  } = usePlayerStore();

  const { playNext, playPrevious } = useQueueStore();

  const handleAdvanceToNext = useCallback(async () => {
    await advanceToNext();
  }, [advanceToNext]);

  // ══════════════════════════════════════════════════════════════
  // 1. Initialize YouTube IFrame API
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
      return;
    }

    window.onYouTubeIframeAPIReady = () => {
      setIsApiReady(true);
    };

    if (!document.getElementById('youtube-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // ══════════════════════════════════════════════════════════════
  // 2. Create the Player Instance
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isApiReady || !containerRef.current || playerRef.current) return;

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
        origin: typeof window !== 'undefined' ? window.location.origin : '',
      },
      events: {
        onReady: () => {
          setPlayerReady(true);
          console.log('[YouTube Player] Ready');
        },
        onStateChange: (event: any) => {
          const state = event.data;
          const YT = window.YT;

          if (state === YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            setDuration(event.target.getDuration());
          } else if (state === YT.PlayerState.PAUSED || state === YT.PlayerState.CUED) {
            if (document.hidden && usePlayerStore.getState().isPlaying) {
              // Try to force play if it was paused while backgrounded
              event.target.playVideo();
            } else {
              setIsPlaying(false);
            }
          } else if (state === YT.PlayerState.ENDED) {
            setIsPlaying(false);
            handleAdvanceToNext();
          }
        },
        onError: () => {
          // If the video fails to load or play, try the next one in the queue after a brief delay
          setTimeout(handleAdvanceToNext, 1000);
        },
      },
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
        setPlayerReady(false);
      }
    };
  }, [isApiReady, setPlayerReady, setIsPlaying, setDuration, handleAdvanceToNext]);

  // ══════════════════════════════════════════════════════════════
  // 3. Sync Current Track (Load new video)
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!currentTrack) return;
    
    // Add to recently played history
    useHistoryStore.getState().addToHistory(currentTrack);
  }, [currentTrack]);

  useEffect(() => {
    if (!currentTrack || !playerRef.current) return;

    // Always load by ID when the track changes or player becomes ready
    if (typeof playerRef.current.loadVideoById === 'function') {
      playerRef.current.loadVideoById(currentTrack.videoId);
      // Wait for it to play, the onStateChange will handle the isPlaying state update
    }
  }, [currentTrack, isApiReady]);

  // ══════════════════════════════════════════════════════════════
  // 4. Sync Play/Pause State (Global toggle)
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!playerRef.current) return;

    if (isPlaying) {
      if (typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo();
      }
    } else {
      if (typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
    }
  }, [isPlaying]);

  // ══════════════════════════════════════════════════════════════
  // 5. Sync Volume
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.setVolume !== 'function') return;
    if (isMuted) {
      playerRef.current.setVolume(0);
    } else {
      playerRef.current.setVolume(volume);
    }
  }, [volume, isMuted]);

  // ══════════════════════════════════════════════════════════════
  // 6. Time Tracking Loop
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isPlaying) return;

    const id = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try { 
          const t = playerRef.current.getCurrentTime();
          if (isFinite(t) && t > 0) setCurrentTime(t);
        } catch { /* ignore */ }
      }
    }, 250);

    return () => clearInterval(id);
  }, [isPlaying, setCurrentTime]);

  // ══════════════════════════════════════════════════════════════
  // 7. Global Expose for Seek and Sync Play (TrackRow.tsx)
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (typeof window === 'undefined') return;

    (window as any).seekTo = (seconds: number) => {
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(seconds, true);
      }
    };

    (window as any).playVideoSync = (videoId?: string) => {
      audioContextRef.current?.resume().catch(() => {});
      silentAudioRef.current?.play().catch(() => {});
      
      if (playerRef.current) {
        if (videoId && typeof playerRef.current.loadVideoById === 'function') {
          playerRef.current.loadVideoById(videoId);
        }
        if (typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
        }
      }
    };

    (window as any).playSilentAudio = () => {
      audioContextRef.current?.resume().catch(() => {});
      silentAudioRef.current?.play().catch(() => {});
    };

    (window as any).pauseSilentAudio = () => {
      silentAudioRef.current?.pause();
    };
  }, []);

  // ══════════════════════════════════════════════════════════════
  // 8. Background Keep-Alive Hacks (Web Audio & Silent Audio)
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    const setup = () => {
      if (audioContextRef.current) return;
      try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        audioContextRef.current = ctx;
        const osc = ctx.createOscillator();
        osc.frequency.value = 1;
        const gain = ctx.createGain();
        gain.gain.value = 0.001;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
      } catch { /* ignore */ }
    };

    const onInteract = () => {
      setup();
      audioContextRef.current?.resume().catch(() => {});
    };

    document.addEventListener('click', onInteract);
    document.addEventListener('touchstart', onInteract);
    return () => {
      document.removeEventListener('click', onInteract);
      document.removeEventListener('touchstart', onInteract);
      audioContextRef.current?.close().catch(() => {});
      audioContextRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      silentAudioRef.current?.play().catch(() => {});
      audioContextRef.current?.resume().catch(() => {});

      if ('wakeLock' in navigator && !wakeLockRef.current) {
        (navigator as any).wakeLock.request('screen')
          .then((lock: any) => {
            wakeLockRef.current = lock;
            lock.addEventListener('release', () => {
              wakeLockRef.current = null;
            });
          })
          .catch(() => {});
      }
    } else {
      silentAudioRef.current?.pause();
      wakeLockRef.current?.release().then(() => { wakeLockRef.current = null; }).catch(() => {});
    }

    if ('mediaSession' in navigator && currentTrack) {
      const art = currentTrack.thumbnails?.high || currentTrack.thumbnails?.default;
      const artwork = art ? [{ src: art, sizes: '512x512', type: 'image/jpeg' }] : [];

      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title || 'Unknown Title',
          artist: currentTrack.artist || 'Unknown Artist',
          album: currentTrack.albumName || 'Unknown Album',
          artwork,
        });
      } catch { /* ignore */ }

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      navigator.mediaSession.setActionHandler('play', () => {
        audioContextRef.current?.resume().catch(() => {});
        silentAudioRef.current?.play().catch(() => {});
        if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
        }
        setIsPlaying(true);
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        silentAudioRef.current?.pause();
        if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
          playerRef.current.pauseVideo();
        }
        setIsPlaying(false);
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        audioContextRef.current?.resume().catch(() => {});
        silentAudioRef.current?.play().catch(() => {});
        const prev = playPrevious();
        if (prev) setCurrentTrack(prev);
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        audioContextRef.current?.resume().catch(() => {});
        silentAudioRef.current?.play().catch(() => {});
        handleAdvanceToNext();
      });
    }
  }, [isPlaying, currentTrack, playNext, playPrevious, setCurrentTrack, setIsPlaying, handleAdvanceToNext]);

  return (
    <>
      <audio
        ref={silentAudioRef}
        src="/silence.mp3"
        loop
        playsInline
        preload="auto"
        className="hidden"
      />
      <div 
        ref={containerRef} 
        className="fixed top-0 left-0 w-px h-px opacity-0 pointer-events-none z-[-9999]"
        style={{ visibility: 'hidden' }}
      />
    </>
  );
}
