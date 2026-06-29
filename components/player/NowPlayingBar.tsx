'use client';

import Image from 'next/image';
import { Heart } from 'lucide-react';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function NowPlayingBar() {
  const { currentTrack, toggleFullscreen } = useYouTubePlayer();

  if (!currentTrack) {
    return (
      <div className="flex items-center w-[30%] min-w-[180px]">
        {/* Placeholder when no track is playing */}
      </div>
    );
  }

  const thumbnail = currentTrack.thumbnails?.medium || currentTrack.thumbnails?.default || '';

  return (
    <div className="flex items-center w-[60%] md:w-[30%] min-w-0 md:min-w-[180px] pr-2 md:pr-4 gap-3 md:gap-4">
      {/* Album Art */}
      <div 
        className="relative h-12 w-12 md:h-14 md:w-14 flex-shrink-0 group rounded-md overflow-hidden bg-muted cursor-pointer"
        onClick={toggleFullscreen}
      >
        {thumbnail && (
          <Image
            src={thumbnail}
            alt={currentTrack.title}
            fill
            className="object-cover"
            sizes="56px"
          />
        )}
      </div>

      {/* Track Info */}
      <div 
        className="flex flex-col justify-center overflow-hidden cursor-pointer"
        onClick={toggleFullscreen}
      >
        <span className="text-sm font-medium text-foreground hover:underline truncate">
          {currentTrack.title}
        </span>
        <span className="text-xs text-muted-foreground hover:underline hover:text-foreground truncate">
          {currentTrack.artist}
        </span>
      </div>

      {/* Like Button */}
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground ml-2 hidden sm:flex"
      >
        <Heart className="h-4 w-4" />
        <span className="sr-only">Like</span>
      </Button>
    </div>
  );
}
