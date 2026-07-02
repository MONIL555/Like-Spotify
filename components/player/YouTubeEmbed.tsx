// ============================================================
// SpotTunes — YouTubeEmbed (Hidden Iframe)
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

export function YouTubeEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const wakeLockRef = useRef<any>(null);
  const fallbackRef = useRef<string | null>(null);

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
    const currentTrackNow = usePlayerStore.getState().currentTrack;
    let nextTrack = playNext(currentTrackNow);
    
    if (nextTrack) {
      setCurrentTrack(nextTrack);
    } else if (currentTrackNow) {
      setCurrentTrack(null);
      setIsPlaying(false);
    } else {
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  }, [playNext, setCurrentTrack, setIsPlaying]);

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
              if (document.hidden && usePlayerStore.getState().isPlaying) {
                console.log('YouTube auto-paused in background, forcing play...');
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
            const currentTrackNow = usePlayerStore.getState().currentTrack;
            console.warn('YouTube Player Error:', event.data, 'for track:', currentTrackNow);
            
            if (!currentTrackNow) {
              setTimeout(() => advanceToNext(), 1000);
              return;
            }

            if ((event.data === 150 || event.data === 101) && fallbackRef.current !== currentTrackNow.videoId) {
              fallbackRef.current = currentTrackNow.videoId;
              try {
                const query = `${currentTrackNow.title} ${currentTrackNow.artist} audio`;
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                
                if (data.items && data.items.length > 0) {
                  const fallback = data.items.find((i: any) => i.videoId !== currentTrackNow.videoId);
                  if (fallback && playerRef.current) {
                    console.log(`Using fallback video ID: ${fallback.videoId} for ${currentTrackNow.videoId}`);
                    playerRef.current.loadVideoById(fallback.videoId);
                    if (!usePlayerStore.getState().isPlaying) {
                      usePlayerStore.getState().setIsPlaying(true);
                    }
                    return; 
                  }
                }
              } catch (err) {
                console.error('Fallback search failed', err);
              }
            }

            setTimeout(() => {
              advanceToNext();
            }, 1000);
          },
        },
      });
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
        setPlayerReady(false);
      }
    };
  }, [isApiReady, setPlayerReady, setIsPlaying, advanceToNext, setDuration]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying && playerRef.current) {
        playerRef.current.playVideo();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);

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
  }, [currentTrack?.videoId]); 

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).seekTo = (seconds: number) => {
        if (playerRef.current) {
          playerRef.current.seekTo(seconds, true);
        }
      };
      
      (window as any).playVideoSync = (videoId?: string) => {
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log('Silent audio play failed:', e));
        }
        if (playerRef.current) {
          if (videoId) {
            playerRef.current.loadVideoById(videoId);
          }
          playerRef.current.playVideo();
        }
      };
      
      (window as any).playSilentAudio = () => {
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log('Silent audio play failed:', e));
        }
      };
      
      (window as any).pauseSilentAudio = () => {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      };
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log('Keep-alive audio failed:', e));
        
        if ('wakeLock' in navigator) {
          (navigator as any).wakeLock.request('screen')
            .then((lock: any) => { wakeLockRef.current = lock; })
            .catch((e: any) => console.log('Wake Lock failed:', e));
        }
      } else {
        audioRef.current.pause();
        
        if (wakeLockRef.current) {
          wakeLockRef.current.release()
            .then(() => { wakeLockRef.current = null; })
            .catch(() => {});
        }
      }
    }

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
        src="/silent.wav"
        loop 
        playsInline 
        preload="auto"
      />
    </div>
  );
}
