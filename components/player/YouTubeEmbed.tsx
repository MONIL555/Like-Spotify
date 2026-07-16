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
    activePlayer, // New
    setPlayerReady,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setCurrentTrack,
    advanceToNext,
  } = usePlayerStore();

  const { playNext, playPrevious } = useQueueStore();
  const isActive = activePlayer === 'youtube'; // New

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
          } else if (state === YT.PlayerState.PAUSED) {
            if (document.hidden && usePlayerStore.getState().isPlaying) {
              // Try to force play if it was paused while backgrounded
              event.target.playVideo();
            } else {
              setIsPlaying(false);
            }
          } else if (state === YT.PlayerState.CUED) {
            // When cued, if we intend to play, force play it
            if (usePlayerStore.getState().isPlaying) {
              event.target.playVideo();
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
    if (!currentTrack || !playerRef.current || !isActive) return;

    // Only load by ID when YouTube is the active player
    if (typeof playerRef.current.loadVideoById === 'function') {
      playerRef.current.loadVideoById(currentTrack.videoId);
      
      // Inform user about limited lockscreen
      import('sonner').then(({ toast }) => {
        toast('ℹ️ Playing via YouTube — lockscreen controls limited.', { 
          description: 'Listen for 30s to unlock full background playback!',
          duration: 5000 
        });
      });
      // Wait for it to play, the onStateChange will handle the isPlaying state update
    }
  }, [currentTrack, isApiReady, isActive]);

  // ══════════════════════════════════════════════════════════════
  // 3.5 Auto-Swap to Cached Version (If available)
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (isActive && currentTrack && currentTrack.source === 'youtube') {
      // Check if it's already cached in the database
      fetch(`/api/cache-track?videoId=${currentTrack.videoId}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'ready' && data.track && data.track.audioUrl) {
            // Swap to the cached track seamlessly
            usePlayerStore.getState().setCurrentTrack({
              ...currentTrack,
              source: data.track.source || 'pagalworld_cached',
              audioUrl: data.track.audioUrl,
            });
          }
        })
        .catch(err => console.error('Failed to check cache status:', err));
    }
  }, [currentTrack?.videoId, isActive]);

  // ══════════════════════════════════════════════════════════════
  // 4. Sync Play/Pause State (Global toggle)
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!playerRef.current) return;

    if (isPlaying && isActive) {
      if (typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo();
      }
    } else {
      if (typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
    }
  }, [isPlaying, isActive]);

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
  // 6. Time Tracking Loop & PagalWorld Cache Trigger
  // ══════════════════════════════════════════════════════════════
  const cacheRequestedRef = useRef(false);

  useEffect(() => {
    cacheRequestedRef.current = false;
  }, [currentTrack?.videoId]);

  useEffect(() => {
    if (!isPlaying || !isActive) return;

    const id = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try { 
          const t = playerRef.current.getCurrentTime();
          if (isFinite(t) && t > 0) {
            setCurrentTime(t);
            
            // Check for caching after 30 seconds
            if (t >= 30 && !cacheRequestedRef.current && currentTrack) {
              cacheRequestedRef.current = true;
              
              import('sonner').then(({ toast }) => {
                toast('🎵 Caching this song for lockscreen playback...', { duration: 3000 });
              });
              
              fetch('/api/cache-track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  videoId: currentTrack.videoId,
                  title: currentTrack.title,
                  artist: currentTrack.artist
                })
              })
              .then(res => res.json())
              .then(data => {
                if (data.status === 'ready') {
                   if (data.message) {
                     import('sonner').then(({ toast }) => {
                       toast.success(`✅ "${currentTrack.title}" is now available with full lockscreen support!`);
                     });
                   }
                } else if (data.error) {
                   import('sonner').then(({ toast }) => {
                       toast.error(`⚠️ Song couldn't be cached — lockscreen won't work for this track`);
                   });
                }
              })
              .catch(err => console.error('Failed to trigger cache:', err));
            }
          }
        } catch { /* ignore */ }
      }
    }, 250);

    return () => clearInterval(id);
  }, [isPlaying, isActive, setCurrentTime, currentTrack]);
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
    if (isPlaying && isActive) {
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
  }, [isPlaying, isActive]);

  // 9a. Set Metadata only when track changes
  useEffect(() => {
    if (!isActive || !currentTrack || !('mediaSession' in navigator)) return;

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
  }, [isActive, currentTrack]);

  // 9b. Update playback state only when playing state changes
  useEffect(() => {
    if (!isActive || !('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isActive, isPlaying]);

  // 9c. Setup action handlers
  useEffect(() => {
    if (!isActive || !('mediaSession' in navigator)) return;

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

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (playerRef.current && typeof playerRef.current.seekTo === 'function' && details.seekTime !== undefined) {
        playerRef.current.seekTo(details.seekTime, true);
      }
    });
  }, [isActive, playPrevious, setCurrentTrack, setIsPlaying, handleAdvanceToNext]);

  return (
    <>
      <audio
        ref={silentAudioRef}
        src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="
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
