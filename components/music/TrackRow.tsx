'use client';

import Image from 'next/image';
import { Play, MoreHorizontal } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { useQueueStore } from '@/store/queueStore';
import { LikeButton } from './LikeButton';
import { Button } from '@/components/ui/button';
import { formatDuration, cn } from '@/lib/utils';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface TrackRowProps {
  track: any; // Using any for now, should be ITrack or YTSearchItem
  index?: number;
  showCover?: boolean;
}

export function TrackRow({ track, index, showCover = true }: TrackRowProps) {
  const { currentTrack, isPlaying, togglePlay, setCurrentTrack } = usePlayerStore();
  const { loadPlaylist } = useQueueStore();
  
  const isCurrentTrack = currentTrack?.videoId === track.videoId;
  
  // Normalize track data since it might come from DB or YouTube API directly
  const title = track.title || 'Unknown Title';
  const artist = track.artist || track.channelName || track.channelTitle || 'Unknown Artist';
  const thumbnail = track.thumbnails?.default?.url || track.thumbnail || track.thumbnails?.default || '';
  const durationText = track.durationText || (track.duration ? formatDuration(track.duration) : '');

  const handlePlay = () => {
    if (isCurrentTrack) {
      togglePlay();
    } else {
      // Load this track as a single-track playlist and set it as current
      const trackData = {
        videoId: track.videoId,
        title,
        artist,
        channelId: track.channelId || '',
        thumbnails: { default: thumbnail, medium: thumbnail, high: thumbnail, maxres: thumbnail },
        duration: track.duration || 0,
        durationText,
        tags: [],
        playCount: 0,
        likeCount: 0,
        cachedAt: new Date()
      } as any;
      const currentTrackToPlay = loadPlaylist([trackData], 0);
      if (currentTrackToPlay) {
        setCurrentTrack(currentTrackToPlay);
      }
    }
  };

  return (
    <div 
      className={cn(
        "group flex items-center gap-4 px-4 py-2 rounded-md hover:bg-surface-hover/50 transition-colors cursor-pointer",
        isCurrentTrack && "bg-surface-hover/30"
      )}
      onClick={handlePlay}
    >
      {/* Index or Play Button */}
      {index !== undefined && (
        <div className="w-8 text-center text-muted-foreground flex items-center justify-center relative">
          <span className={cn("group-hover:opacity-0", isCurrentTrack && "text-brand-primary")}>
            {isCurrentTrack && isPlaying ? (
              // Simple equalizer animation placeholder
              <div className="flex items-end gap-0.5 h-4">
                <div className="w-1 bg-brand-primary h-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 bg-brand-primary h-2/3 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 bg-brand-primary h-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              index + 1
            )}
          </span>
          <Play className={cn(
            "h-4 w-4 absolute opacity-0 group-hover:opacity-100 fill-current",
            isCurrentTrack && "text-brand-primary"
          )} />
        </div>
      )}

      {/* Cover */}
      {showCover && (
        <div className="relative h-10 w-10 flex-shrink-0 bg-muted rounded overflow-hidden">
          {thumbnail && (
            <Image src={thumbnail} alt={title} fill className="object-cover" sizes="40px" />
          )}
          {/* Overlay play button for list without index */}
          {index === undefined && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="h-4 w-4 text-white fill-white" />
            </div>
          )}
        </div>
      )}

      {/* Title & Artist */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className={cn(
          "font-medium truncate",
          isCurrentTrack ? "text-brand-primary" : "text-foreground"
        )}>
          {title}
        </div>
        <div className="text-sm text-muted-foreground truncate hover:underline hover:text-foreground">
          {artist}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <LikeButton videoId={track.videoId} />
        
        <span className="text-sm text-muted-foreground min-w-[40px] text-right hidden sm:block">
          {durationText}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* Add to queue logic */ }}>
              Add to queue
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
              Go to artist
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
              Share
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
