'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

export function VolumeControl() {
  const { volume, setVolume, isMuted, toggleMute } = usePlayerStore();

  return (
    <div className="flex items-center gap-3 w-32 group">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-surface-hover shrink-0"
        onClick={toggleMute}
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
        ) : (
          <Volume2 className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
        )}
      </Button>
      <Slider
        value={isMuted ? 0 : volume}
        max={100}
        step={1}
        onChange={setVolume}
        className="flex-1"
      />
    </div>
  );
}
