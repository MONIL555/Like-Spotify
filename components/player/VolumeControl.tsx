'use client';

import { Volume, Volume1, Volume2, VolumeX, Mic2, ListMusic, Maximize2 } from 'lucide-react';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function VolumeControl() {
  const {
    volume,
    isMuted,
    isLyricsOpen,
    isQueueOpen,
    setVolume,
    toggleMute,
    toggleLyrics,
    toggleQueue,
    toggleFullscreen,
    isPlayerReady,
  } = useYouTubePlayer();

  const handleVolumeChange = (value: number[]) => {
    const val = value[0];
    setVolume(val);
  };

  const VolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="h-5 w-5" />;
    if (volume < 33) return <Volume className="h-5 w-5" />;
    if (volume < 66) return <Volume1 className="h-5 w-5" />;
    return <Volume2 className="h-5 w-5" />;
  };

  return (
    <div className="flex items-center justify-end w-auto md:w-[30%] md:min-w-[180px] gap-2">
      {/* Lyrics Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLyrics}
            className={cn(
              "hidden lg:flex transition-colors",
              isLyricsOpen ? "text-accent-coral" : "text-white/50 hover:text-white"
            )}
          >
            <Mic2 className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-black/90 text-white border-white/10">Lyrics</TooltipContent>
      </Tooltip>

      {/* Queue Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleQueue}
            className={cn(
              "hidden md:flex transition-colors",
              isQueueOpen ? "text-accent-coral" : "text-white/50 hover:text-white"
            )}
          >
            <ListMusic className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-black/90 text-white border-white/10">Queue</TooltipContent>
      </Tooltip>

      {/* Volume Controls */}
      <div className="flex items-center gap-2 group hidden sm:flex">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="text-white/50 hover:text-white transition-colors h-9 w-9"
          disabled={!isPlayerReady}
        >
          <VolumeIcon />
        </Button>
        <div className="w-24 flex items-center">
          <Slider
            value={[isMuted ? 0 : volume]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            disabled={!isPlayerReady}
            className="w-full cursor-pointer [&_[role=slider]]:opacity-0 group-hover:[&_[role=slider]]:opacity-100 [&_[role=slider]]:transition-opacity [&_[role=slider]]:bg-white [&>.bg-primary]:bg-white"
          />
        </div>
      </div>

      {/* Fullscreen Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="hidden lg:flex ml-2 text-white/50 hover:text-white transition-colors"
          >
            <Maximize2 className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-black/90 text-white border-white/10">Fullscreen</TooltipContent>
      </Tooltip>
    </div>
  );
}
