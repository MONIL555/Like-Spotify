'use client';

import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/store/playerStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const TIMER_OPTIONS = [
  { label: 'Off', minutes: 0 },
  { label: '5 minutes', minutes: 5 },
  { label: '15 minutes', minutes: 15 },
  { label: '30 minutes', minutes: 30 },
  { label: '45 minutes', minutes: 45 },
  { label: '1 hour', minutes: 60 },
];

export function SleepTimer() {
  const { togglePlay, isPlaying } = usePlayerStore();
  const [endTime, setEndTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!endTime) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        clearInterval(interval);
        setEndTime(null);
        setTimeLeft(null);
        if (isPlaying) {
          togglePlay();
          toast('Sleep timer finished', { description: 'Playback has been paused.' });
        }
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, isPlaying, togglePlay]);

  const handleSelect = (minutes: number) => {
    if (minutes === 0) {
      setEndTime(null);
      toast('Sleep timer turned off');
    } else {
      const newEndTime = Date.now() + minutes * 60000;
      setEndTime(newEndTime);
      toast(`Sleep timer set for ${minutes} minutes`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground h-10 w-10 ${endTime ? 'text-brand-primary hover:text-brand-primary' : ''}`}>
        <Timer className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" side="top" className="w-48 mb-4 mr-4">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Sleep Timer</span>
          {timeLeft && <span className="text-brand-primary font-mono text-xs">{timeLeft}</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TIMER_OPTIONS.map((opt) => (
          <DropdownMenuItem 
            key={opt.minutes} 
            onClick={() => handleSelect(opt.minutes)}
            className="cursor-pointer"
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
