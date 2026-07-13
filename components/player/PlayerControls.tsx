'use client';

import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { useQueueStore } from '@/store/queueStore';
import { Button } from '@/components/ui/button';

export function PlayerControls() {
  const { 
    isPlaying, togglePlay, 
    advanceToNext,
    setCurrentTrack
  } = usePlayerStore();
  
  const { playPrevious } = useQueueStore();

  const handleNext = () => {
    if (typeof window !== 'undefined' && (window as any).playVideoSync) {
      (window as any).playVideoSync();
    } else if (typeof window !== 'undefined' && (window as any).playSilentAudio) {
      (window as any).playSilentAudio();
    }
    advanceToNext();
  };

  const handlePrev = () => {
    const prev = playPrevious();
    if (prev) {
      if (typeof window !== 'undefined' && (window as any).playVideoSync) {
        (window as any).playVideoSync(prev.videoId);
      } else if (typeof window !== 'undefined' && (window as any).playSilentAudio) {
        (window as any).playSilentAudio();
      }
      setCurrentTrack(prev);
    }
  };

  return (
    <div className="flex items-center justify-center gap-8 md:gap-12 w-full">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrev}
        className="h-12 w-12 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full transition-all hover:scale-105"
      >
        <SkipBack className="h-6 w-6 fill-current" />
      </Button>

      <Button
        size="icon"
        onClick={togglePlay}
        active={isPlaying}
        className="h-16 w-16 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:scale-105 transition-transform border-0 !bg-white !text-black hover:!bg-white/90"
        style={{ backgroundColor: '#ffffff', color: '#000000' }}
      >
        {isPlaying ? (
          <Pause className="h-7 w-7 fill-current" />
        ) : (
          <Play className="h-7 w-7 fill-current ml-1" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleNext}
        className="h-12 w-12 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full transition-all hover:scale-105"
      >
        <SkipForward className="h-6 w-6 fill-current" />
      </Button>
    </div>
  );
}
