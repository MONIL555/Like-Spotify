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
    <div className="flex items-center justify-center gap-3 md:gap-6 mb-2">
      {/* Shuffle Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleShuffle}
            className={cn(
              "transition-colors",
              shuffle ? "text-accent-coral" : "text-white/50 hover:text-white"
            )}
            disabled={!isPlayerReady}
          >
            <Shuffle className="h-4 w-4" />
            <span className="sr-only">Shuffle</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-black/90 text-white border-white/10">
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
            className="text-white/70 hover:text-white transition-colors"
            disabled={!isPlayerReady || !hasPrev}
          >
            <SkipBack className="h-6 w-6 fill-current" />
            <span className="sr-only">Previous</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-black/90 text-white border-white/10">Previous</TooltipContent>
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
        className="h-12 w-12 rounded-full bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] hover:scale-105 transition-all duration-300"
        disabled={!isPlayerReady}
      >
        {isPlaying ? (
          <Pause className="h-6 w-6 fill-current" />
        ) : (
          <Play className="h-6 w-6 fill-current ml-1" />
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
            className="text-white/70 hover:text-white transition-colors"
            disabled={!isPlayerReady || (!hasNext && !currentTrack) || isFetchingNext}
          >
            {isFetchingNext ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <SkipForward className="h-6 w-6 fill-current" />
            )}
            <span className="sr-only">Next</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-black/90 text-white border-white/10">Next</TooltipContent>
      </Tooltip>

      {/* Repeat Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={cycleRepeat}
            className={cn(
              "transition-colors",
              repeat !== 'off' ? "text-accent-coral" : "text-white/50 hover:text-white"
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
        <TooltipContent side="top" className="bg-black/90 text-white border-white/10">
          {repeat === 'off' ? 'Enable repeat' : repeat === 'all' ? 'Enable repeat one' : 'Disable repeat'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
