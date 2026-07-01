'use client';

import { useState } from 'react';

import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { usePlayerStore } from '@/store/playerStore';
import { useQueueStore } from '@/store/queueStore';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function PlayerControls() {
  const {
    isPlaying,
    shuffle,
    repeat,
    isPlayerReady,
    currentTrack,
    togglePlay,
    toggleShuffle,
    cycleRepeat,
  } = useYouTubePlayer();

  const { setCurrentTrack } = usePlayerStore();
  const { playNext, playPrevious, queue, history } = useQueueStore();

  const hasNext = queue.length > 0;
  const hasPrev = history.length > 0;
  const [isFetchingNext, setIsFetchingNext] = useState(false);

  const handlePlayNext = async () => {
    if (typeof window !== 'undefined' && (window as any).playSilentAudio) {
      (window as any).playSilentAudio();
    }
    if (queue.length > 0) {
      const nextTrack = playNext(currentTrack);
      if (nextTrack) {
        setCurrentTrack(nextTrack);
      }
    } else if (currentTrack) {
      // Dynamic mix (autoplay) - Temporarily disabled
      /*
      try {
        setIsFetchingNext(true);
        const res = await fetch(`/api/autoplay?videoId=${currentTrack.videoId}&artist=${encodeURIComponent(currentTrack.artist)}`);
        const data = await res.json();
        if (data.playlist && data.playlist.length > 0) {
          useQueueStore.setState((state) => ({ queue: [...state.queue, ...data.playlist] }));
          const nextTrack = playNext(currentTrack);
          if (nextTrack) setCurrentTrack(nextTrack);
        }
      } catch (err) {
        console.error('Failed to fetch autoplay track', err);
      } finally {
        setIsFetchingNext(false);
      }
      */
    }
  };


  const handlePlayPrevious = () => {
    if (typeof window !== 'undefined' && (window as any).playSilentAudio) {
      (window as any).playSilentAudio();
    }
    const prevTrack = playPrevious();
    if (prevTrack) {
      setCurrentTrack(prevTrack);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 mb-2">
      {/* Shuffle Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleShuffle}
            className={cn(
              "hidden sm:flex text-muted-foreground hover:text-foreground",
              shuffle && "text-brand-primary hover:text-brand-hover"
            )}
            disabled={!isPlayerReady}
          >
            <Shuffle className="h-4 w-4" />
            <span className="sr-only">Shuffle</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {shuffle ? 'Disable shuffle' : 'Enable shuffle'}
        </TooltipContent>
      </Tooltip>

      {/* Previous Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePlayPrevious}
            className="text-muted-foreground hover:text-foreground"
            disabled={!isPlayerReady || !hasPrev}
          >
            <SkipBack className="h-5 w-5 fill-current" />
            <span className="sr-only">Previous</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Previous</TooltipContent>
      </Tooltip>

      <Button
        variant="default"
        size="icon"
        onClick={() => {
          if (!isPlaying && typeof window !== 'undefined' && (window as any).playSilentAudio) {
            (window as any).playSilentAudio();
          } else if (isPlaying && typeof window !== 'undefined' && (window as any).pauseSilentAudio) {
            (window as any).pauseSilentAudio();
          }
          togglePlay();
        }}
        className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-foreground text-background hover:bg-foreground/90 hover:scale-105 transition-transform"
        disabled={!isPlayerReady}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 md:h-5 md:w-5 fill-current" />
        ) : (
          <Play className="h-4 w-4 md:h-5 md:w-5 fill-current ml-0.5" />
        )}
        <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
      </Button>

      {/* Next Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePlayNext}
            className="text-muted-foreground hover:text-foreground"
            disabled={!isPlayerReady || (!hasNext && !currentTrack) || isFetchingNext}
          >
            {isFetchingNext ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <SkipForward className="h-5 w-5 fill-current" />
            )}
            <span className="sr-only">Next</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Next</TooltipContent>
      </Tooltip>

      {/* Repeat Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={cycleRepeat}
            className={cn(
              "hidden sm:flex text-muted-foreground hover:text-foreground",
              repeat !== 'off' && "text-brand-primary hover:text-brand-hover"
            )}
            disabled={!isPlayerReady}
          >
            {repeat === 'one' ? (
              <Repeat1 className="h-4 w-4" />
            ) : (
              <Repeat className="h-4 w-4" />
            )}
            <span className="sr-only">Repeat</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {repeat === 'off' ? 'Enable repeat' : repeat === 'all' ? 'Enable repeat one' : 'Disable repeat'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
