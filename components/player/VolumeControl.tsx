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
    if (isMuted || volume === 0) return <VolumeX className="h-4 w-4" />;
    if (volume < 33) return <Volume className="h-4 w-4" />;
    if (volume < 66) return <Volume1 className="h-4 w-4" />;
    return <Volume2 className="h-4 w-4" />;
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
              "text-muted-foreground hover:text-foreground hidden lg:flex",
              isLyricsOpen && "text-brand-primary hover:text-brand-hover"
            )}
          >
            <Mic2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Lyrics</TooltipContent>
      </Tooltip>

      {/* Queue Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleQueue}
            className={cn(
              "text-muted-foreground hover:text-foreground hidden md:flex",
              isQueueOpen && "text-brand-primary hover:text-brand-hover"
            )}
          >
            <ListMusic className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Queue</TooltipContent>
      </Tooltip>

      {/* Volume Controls */}
      <div className="flex items-center gap-2 group hidden sm:flex">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="text-muted-foreground hover:text-foreground h-8 w-8"
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
            className="w-full"
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
            className="text-muted-foreground hover:text-foreground hidden lg:flex ml-2"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Fullscreen</TooltipContent>
      </Tooltip>
    </div>
  );
}
