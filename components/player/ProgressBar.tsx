'use client';

import { usePlayerStore } from '@/store/playerStore';
import { Slider } from '@/components/ui/slider';
import { formatDuration } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function ProgressBar() {
  const { currentTime, duration } = usePlayerStore();
  const [localTime, setLocalTime] = useState(currentTime);
  const [isDragging, setIsDragging] = useState(false);

  // Sync local time with store time unless we're actively dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalTime(currentTime);
    }
  }, [currentTime, isDragging]);

  const handleChange = (val: number) => {
    setIsDragging(true);
    setLocalTime(val);
  };

  const handleCommit = (val: number) => {
    setIsDragging(false);
    if (typeof window !== 'undefined' && (window as any).seekTo) {
      (window as any).seekTo(val);
    }
  };

  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-xs font-semibold text-muted-foreground min-w-[40px] text-right">
        {formatDuration(localTime)}
      </span>
      <Slider
        value={localTime}
        max={duration || 100}
        step={1}
        onChange={handleChange}
        onValueCommit={handleCommit}
        className="flex-1"
      />
      <span className="text-xs font-semibold text-muted-foreground min-w-[40px]">
        {formatDuration(duration)}
      </span>
    </div>
  );
}
