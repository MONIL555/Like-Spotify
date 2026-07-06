// ============================================================
// SpotTunes — YouTubeEmbed (Hybrid Player v3 — Lazy Iframe)
// ============================================================
// PRIMARY  → Native <audio> via /api/stream proxy (same-origin)
// FALLBACK → YouTube IFrame — created ON DEMAND only when
//            native audio actually fails. This eliminates all
//            iframe CORS/network noise when native mode works.
// ============================================================

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { useQueueStore } from '@/store/queueStore';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

type PlayerMode = 'native' | 'iframe' | 'idle';

export function YouTubeEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const silentAudioRef = useRef<HTMLAudioElement>(null);
  const nativeAudioRef = useRef<HTMLAudioElement>(null);
  const wakeLockRef = useRef<any>(null);
  const fallbackRef = useRef<string | null>(null);

  // Hybrid state
  const playerModeRef = useRef<PlayerMode>('idle');
  const switchingRef = useRef(false);
  const currentVideoIdRef = useRef<string | null>(null);

  // Lazy iframe
  const iframeReadyRef = useRef(false);
  const iframePromiseRef = useRef<Promise<void> | null>(null);

  // Background hardening
  const audioContextRef = useRef<AudioContext | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const webLockAbortRef = useRef<AbortController | null>(null);

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

  const advanceToNext = useCallback(async () => {
    currentVideoIdRef.current = null; // Allow next track to load
    const now = usePlayerStore.getState().currentTrack;
    const next = playNext(now);
    if (next) setCurrentTrack(next);
    else { setCurrentTrack(null); setIsPlaying(false); }
  }, [playNext, setCurrentTrack, setIsPlaying]);

  const stopNative = useCallback(() => {
    if (nativeAudioRef.current) {
      nativeAudioRef.current.pause();
      nativeAudioRef.current.removeAttribute('src');
      nativeAudioRef.current.load();
    }
  }, []);

  const stopIframe = useCallback(() => {
    try { playerRef.current?.stopVideo(); } catch { /* ignore */ }
  }, []);

  // ══════════════════════════════════════════════════════════════
  // LAZY IFRAME: Only created when native audio fails
  // ══════════════════════════════════════════════════════════════
  const ensureIframeReady = useCallback((): Promise<void> => {
    if (iframeReadyRef.current && playerRef.current) return Promise.resolve();
    if (iframePromiseRef.current) return iframePromiseRef.current;
    if (!isApiReady || !containerRef.current) return Promise.resolve();

    iframePromiseRef.current = new Promise<void>((resolve) => {
      console.log('[Hybrid] Creating iframe fallback player...');
      playerRef.current = new window.YT.Player(containerRef.current!, {
        height: '100',
        width: '100',
        playerVars: {
          autoplay: 0, controls: 0, disablekb: 1, fs: 0,
          iv_load_policy: 3, rel: 0, showinfo: 0,
          modestbranding: 1, playsinline: 1,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        },
        events: {
          onReady: () => {
            iframeReadyRef.current = true;
            console.log('[Hybrid] Iframe fallback ready');
            resolve();
          },

          onStateChange: (event: any) => {
            if (playerModeRef.current !== 'iframe' || switchingRef.current) return;
            const state = event.data;
            const YT = window.YT;

            if (state === YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setDuration(event.target.getDuration());
            } else if (state === YT.PlayerState.PAUSED || state === YT.PlayerState.CUED) {
              if (document.hidden && usePlayerStore.getState().isPlaying) {
                event.target.playVideo();
              } else {
                setIsPlaying(false);
              }
            } else if (state === YT.PlayerState.ENDED) {
              setIsPlaying(false);
              advanceToNext();
            }
          },

          onError: async (event: any) => {
            if (playerModeRef.current !== 'iframe') return;
            const track = usePlayerStore.getState().currentTrack;
            if (!track) { setTimeout(advanceToNext, 1000); return; }

            if (fallbackRef.current !== track.videoId) {
              fallbackRef.current = track.videoId;
              try {
                const q = `${track.title || ''} ${track.artist || track.channelTitle || ''} audio`.trim();
                const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
                const data = await res.json();
                const alt = data.items?.find((i: any) => i.videoId !== track.videoId);
                if (alt && playerRef.current) {
                  playerRef.current.loadVideoById(alt.videoId);
                  if (!usePlayerStore.getState().isPlaying) setIsPlaying(true);
                  return;
                }
              } catch { /* ignore */ }
            }
            setTimeout(advanceToNext, 1000);
          },
        },
      });
    });

    return iframePromiseRef.current;
  }, [isApiReady, setIsPlaying, setDuration, advanceToNext]);

  // ══════════════════════════════════════════════════════════════
  // 1. Load YouTube API script (background, for potential fallback)
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    // Player is ready immediately — native audio doesn't need iframe
    setPlayerReady(true);

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const first = document.getElementsByTagName('script')[0];
      first.parentNode?.insertBefore(tag, first);
      window.onYouTubeIframeAPIReady = () => setIsApiReady(true);
    } else {
      setIsApiReady(true);
    }
  }, [setPlayerReady]);

  // ══════════════════════════════════════════════════════════════
  // 2. Native Audio Event Listeners
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    const audio = nativeAudioRef.current;
    if (!audio) return;

    const onDurationChange = () => {
      if (playerModeRef.current === 'native' && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      if (playerModeRef.current === 'native') {
        setIsPlaying(false);
        advanceToNext();
      }
    };

    const triggerIframeFallback = async (resumeTime = 0) => {
      if (switchingRef.current || playerModeRef.current === 'iframe') return;
      
      const videoId = currentVideoIdRef.current;
      if (!videoId) return;

      console.log(`[Hybrid] ✗ Native stream failed at ${resumeTime.toFixed(1)}s → Falling back to iframe for ${videoId}`);
      
      switchingRef.current = true;
      playerModeRef.current = 'iframe';
      stopNative();

      await ensureIframeReady();
      if (playerRef.current) {
        playerRef.current.loadVideoById({
          videoId,
          startSeconds: resumeTime,
        });
      }
      switchingRef.current = false;
      setIsPlaying(true);
    };

    const onError = () => {
      triggerIframeFallback(audio.currentTime || 0);
    };

    // Attach triggerIframeFallback to audio object so it can be called from catch block
    (audio as any)._triggerFallback = triggerIframeFallback;

    const onPause = () => {
      if (playerModeRef.current !== 'native' || switchingRef.current) return;
      if (document.hidden && usePlayerStore.getState().isPlaying) {
        audio.play().catch(() => {});
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('pause', onPause);
    };
  }, [setDuration, setIsPlaying, advanceToNext, stopNative, ensureIframeReady]);

  // ══════════════════════════════════════════════════════════════
  // 3. Web Audio API Keep-Alive
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

  // ══════════════════════════════════════════════════════════════
  // 4. Visibility Change (Hardened)
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    const handler = async () => {
      const playing = usePlayerStore.getState().isPlaying;

      if (document.hidden && playing) {
        if (playerModeRef.current === 'native') {
          nativeAudioRef.current?.play().catch(() => {});
        } else if (playerModeRef.current === 'iframe') {
          try { playerRef.current?.playVideo(); } catch { /* ignore */ }
        }
        audioContextRef.current?.resume().catch(() => {});
      }

      if (!document.hidden && playing) {
        if ('wakeLock' in navigator && !wakeLockRef.current) {
          try {
            wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
            wakeLockRef.current.addEventListener('release', () => { wakeLockRef.current = null; });
          } catch { /* ignore */ }
        }
        if (playerModeRef.current === 'native' && nativeAudioRef.current?.paused) {
          nativeAudioRef.current.play().catch(() => {});
        } else if (playerModeRef.current === 'iframe') {
          try {
            const s = playerRef.current?.getPlayerState?.();
            if (s !== undefined && window.YT && s !== window.YT.PlayerState.PLAYING) playerRef.current.playVideo();
          } catch { /* ignore */ }
        }
        audioContextRef.current?.resume().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // ══════════════════════════════════════════════════════════════
  // 5. Watchdog Timer
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (watchdogRef.current) { clearInterval(watchdogRef.current); watchdogRef.current = null; }
    if (!isPlaying) return;

    watchdogRef.current = setInterval(() => {
      if (!usePlayerStore.getState().isPlaying) return;

      if (playerModeRef.current === 'native' && nativeAudioRef.current) {
        if (nativeAudioRef.current.paused && !nativeAudioRef.current.ended) {
          nativeAudioRef.current.play().catch(() => {});
        }
      } else if (playerModeRef.current === 'iframe' && playerRef.current) {
        try {
          const s = playerRef.current.getPlayerState?.();
          if (s !== undefined && window.YT &&
            s !== window.YT.PlayerState.PLAYING &&
            s !== window.YT.PlayerState.BUFFERING &&
            s !== window.YT.PlayerState.ENDED) {
            playerRef.current.playVideo();
          }
        } catch { /* ignore */ }
      }
      audioContextRef.current?.resume().catch(() => {});
    }, 2000);

    return () => { if (watchdogRef.current) { clearInterval(watchdogRef.current); watchdogRef.current = null; } };
  }, [isPlaying]);

  // ══════════════════════════════════════════════════════════════
  // 6. Web Locks API
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!('locks' in navigator)) return;
    if (isPlaying) {
      const c = new AbortController();
      webLockAbortRef.current = c;
      navigator.locks.request('spottunes-keepalive', { signal: c.signal }, () => new Promise(() => {})).catch(() => {});
    } else {
      webLockAbortRef.current?.abort(); webLockAbortRef.current = null;
    }
    return () => { webLockAbortRef.current?.abort(); webLockAbortRef.current = null; };
  }, [isPlaying]);

  // ══════════════════════════════════════════════════════════════
  // 7. HYBRID TRACK LOADING
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    const videoId = currentTrack?.videoId;

    if (!videoId) {
      currentVideoIdRef.current = null;
      playerModeRef.current = 'idle';
      stopNative();
      stopIframe();
      setIsPlaying(false);
      return;
    }

    if (videoId.length < 11) {
      advanceToNext();
      return;
    }

    // Prevent re-loading same video (fixes restart loops)
    if (currentVideoIdRef.current === videoId) return;
    currentVideoIdRef.current = videoId;
    fallbackRef.current = null;

    // Stop any current playback
    switchingRef.current = true;
    stopNative();
    stopIframe();

    const audio = nativeAudioRef.current;
    if (!audio) {
      switchingRef.current = false;
      return;
    }

    // Try native audio via same-origin proxy
    audio.src = `/api/stream?videoId=${videoId}`;
    playerModeRef.current = 'native';
    switchingRef.current = false;

    audio.play()
      .then(() => {
        console.log(`[Hybrid] ✓ Native audio playing: ${videoId}`);
        setIsPlaying(true);
        silentAudioRef.current?.play().catch(() => {});
      })
      .catch((err) => {
        if ((audio as any)._triggerFallback) {
          (audio as any)._triggerFallback(0);
        } else {
          console.log(`[Hybrid] ✗ Native play failed: ${err.message} → fallback unavailable`);
        }
      });
  }, [currentTrack?.videoId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ══════════════════════════════════════════════════════════════
  // 8. Play/Pause Toggle
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!currentTrack || switchingRef.current) return;

    if (playerModeRef.current === 'native' && nativeAudioRef.current) {
      if (isPlaying && nativeAudioRef.current.paused) {
        nativeAudioRef.current.play().catch(() => {});
      } else if (!isPlaying && !nativeAudioRef.current.paused) {
        nativeAudioRef.current.pause();
      }
    } else if (playerModeRef.current === 'iframe' && playerRef.current) {
      try {
        const state = playerRef.current.getPlayerState();
        const YT = window.YT;
        if (isPlaying && state !== YT.PlayerState.PLAYING) playerRef.current.playVideo();
        else if (!isPlaying && state === YT.PlayerState.PLAYING) playerRef.current.pauseVideo();
      } catch { /* player not ready */ }
    }
  }, [isPlaying, currentTrack]);

  // ══════════════════════════════════════════════════════════════
  // 9. Volume & Mute
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (nativeAudioRef.current) {
      nativeAudioRef.current.volume = isMuted ? 0 : volume / 100;
    }
    if (playerRef.current) {
      try {
        playerRef.current.setVolume(volume);
        if (isMuted) playerRef.current.mute(); else playerRef.current.unMute();
      } catch { /* ignore */ }
    }
  }, [volume, isMuted]);

  // ══════════════════════════════════════════════════════════════
  // 10. Unified Time Tracking (works for BOTH modes)
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isPlaying) return;

    const id = setInterval(() => {
      const mode = playerModeRef.current;
      if (mode === 'native' && nativeAudioRef.current) {
        const t = nativeAudioRef.current.currentTime;
        if (isFinite(t)) setCurrentTime(t);
      } else if (mode === 'iframe' && playerRef.current?.getCurrentTime) {
        try { setCurrentTime(playerRef.current.getCurrentTime()); } catch { /* ignore */ }
      }
    }, 250);

    return () => clearInterval(id);
  }, [isPlaying, setCurrentTime]);

  // ══════════════════════════════════════════════════════════════
  // 11. Global Methods
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (typeof window === 'undefined') return;

    (window as any).seekTo = (seconds: number) => {
      if (playerModeRef.current === 'native' && nativeAudioRef.current) {
        nativeAudioRef.current.currentTime = seconds;
      } else if (playerRef.current) {
        playerRef.current.seekTo(seconds, true);
      }
    };

    (window as any).playVideoSync = (videoId?: string) => {
      audioContextRef.current?.resume().catch(() => {});
      silentAudioRef.current?.play().catch(() => {});
      if (playerModeRef.current === 'native' && nativeAudioRef.current) {
        nativeAudioRef.current.play().catch(() => {});
      } else if (playerRef.current) {
        if (videoId) playerRef.current.loadVideoById(videoId);
        playerRef.current.playVideo();
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
  // 12. Background Keep-Alive & Media Session
  // ══════════════════════════════════════════════════════════════
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
              if (usePlayerStore.getState().isPlaying && !document.hidden) {
                (navigator as any).wakeLock.request('screen')
                  .then((l: any) => { wakeLockRef.current = l; l.addEventListener('release', () => { wakeLockRef.current = null; }); })
                  .catch(() => {});
              }
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
        if (playerModeRef.current === 'native') nativeAudioRef.current?.play().catch(() => {});
        else playerRef.current?.playVideo();
        setIsPlaying(true);
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        silentAudioRef.current?.pause();
        if (playerModeRef.current === 'native') nativeAudioRef.current?.pause();
        else playerRef.current?.pauseVideo();
        setIsPlaying(false);
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        audioContextRef.current?.resume().catch(() => {});
        silentAudioRef.current?.play().catch(() => {});
        currentVideoIdRef.current = null;
        const prev = playPrevious();
        if (prev) setCurrentTrack(prev);
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        audioContextRef.current?.resume().catch(() => {});
        silentAudioRef.current?.play().catch(() => {});
        advanceToNext();
      });

      try {
        const d = usePlayerStore.getState().duration;
        const t = usePlayerStore.getState().currentTime;
        if (d > 0) navigator.mediaSession.setPositionState({ duration: d, playbackRate: 1, position: Math.min(t, d) });
      } catch { /* ignore */ }
    }
  }, [isPlaying, currentTrack, playNext, playPrevious, setCurrentTrack, setIsPlaying, advanceToNext]);

  // ══════════════════════════════════════════════════════════════
  // 13. Lock Screen Progress
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isPlaying || !('mediaSession' in navigator)) return;
    const id = setInterval(() => {
      try {
        const { duration, currentTime } = usePlayerStore.getState();
        if (duration > 0) navigator.mediaSession.setPositionState({ duration, playbackRate: 1, position: Math.min(currentTime, duration) });
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(id);
  }, [isPlaying]);

  // ══════════════════════════════════════════════════════════════
  // Cleanup
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
        iframeReadyRef.current = false;
        iframePromiseRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className="fixed pointer-events-none opacity-[0.01] z-[-1]"
      style={{ width: '10px', height: '10px', top: '0', left: '0', overflow: 'hidden' }}
    >
      <div ref={containerRef} id="youtube-player" />
      <audio ref={nativeAudioRef} playsInline preload="auto" />
      <audio ref={silentAudioRef} src="/silent.wav" loop playsInline preload="auto" />
    </div>
  );
}
