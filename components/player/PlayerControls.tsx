'use client';

import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { useQueueStore } from '@/store/queueStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PlayerControls() {
  const { 
    isPlaying, togglePlay, 
    shuffle, toggleShuffle,
    repeat, cycleRepeat,
    currentTrack 
  } = usePlayerStore();
  
  const { playNext, playPrevious } = useQueueStore();
  const { setCurrentTrack } = usePlayerStore();

  const handleNext = () => {
    const next = playNext(currentTrack);
    if (next) setCurrentTrack(next);
  };

  const handlePrev = () => {
    const prev = playPrevious();
    if (prev) setCurrentTrack(prev);
  };

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleShuffle}
        className={cn(
          "h-10 w-10 transition-colors",
          shuffle ? "text-brand-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Shuffle className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrev}
        className="h-10 w-10 text-muted-foreground hover:text-foreground"
      >
        <SkipBack className="h-5 w-5 fill-current" />
      </Button>

      <Button
        size="icon"
        onClick={togglePlay}
        active={isPlaying}
        className="h-14 w-14 rounded-full"
      >
        {isPlaying ? (
          <Pause className="h-6 w-6 fill-current text-brand-primary" />
        ) : (
          <Play className="h-6 w-6 fill-current text-foreground ml-1" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleNext}
        className="h-10 w-10 text-muted-foreground hover:text-foreground"
      >
        <SkipForward className="h-5 w-5 fill-current" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={cycleRepeat}
        className={cn(
          "h-10 w-10 transition-colors relative",
          repeat !== 'off' ? "text-brand-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Repeat className="h-4 w-4" />
        {repeat === 'one' && (
          <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-brand-primary text-white rounded-full h-3 w-3 flex items-center justify-center">
            1
          </span>
        )}
      </Button>
    </div>
  );
}
