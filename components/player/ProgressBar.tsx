'use client';

import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { Slider } from '@/components/ui/slider';
import { formatDuration } from '@/lib/utils';
import { useState, useEffect } from 'react';

export function ProgressBar() {
  const { currentTime, duration, seekTo, isPlayerReady } = useYouTubePlayer();
  const [localValue, setLocalValue] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Sync with store when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(currentTime);
    }
  }, [currentTime, isDragging]);

  const handleValueChange = (value: number | readonly number[]) => {
    setIsDragging(true);
    setLocalValue(Array.isArray(value) ? value[0] : value);
  };

  const handleValueCommit = (value: number | readonly number[]) => {
    setIsDragging(false);
    seekTo(Array.isArray(value) ? value[0] : value);
  };

  return (
    <div className="flex items-center gap-2 w-full max-w-[600px]">
      <span className="text-xs text-muted-foreground min-w-[40px] text-right">
        {formatDuration(isDragging ? localValue : currentTime)}
      </span>
      
      <Slider
        value={[isDragging ? localValue : currentTime]}
        max={duration || 100}
        step={1}
        onValueChange={handleValueChange}
        onValueCommitted={handleValueCommit}
        disabled={!isPlayerReady || duration === 0}
        className="flex-1 group"
      />
      
      <span className="text-xs text-muted-foreground min-w-[40px]">
        {formatDuration(duration)}
      </span>
    </div>
  );
}
