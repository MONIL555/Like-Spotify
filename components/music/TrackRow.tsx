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
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import useSWR from 'swr';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface TrackRowProps {
  track: any; // Using any for now, should be ITrack or YTSearchItem
  index?: number;
  showCover?: boolean;
  onRemove?: () => void;
  contextTracks?: any[];
}

export function TrackRow({ track, index, showCover = true, onRemove, contextTracks }: TrackRowProps) {
  const { currentTrack, isPlaying, togglePlay, setCurrentTrack } = usePlayerStore();
  const { loadPlaylist } = useQueueStore();
  const { data: playlists } = useSWR('/api/playlists', fetcher);
  
  const isCurrentTrack = currentTrack?.videoId === track.videoId;
  
  // Normalize track data since it might come from DB or YouTube API directly
  const title = track.title || 'Unknown Title';
  const artist = track.artist || track.channelName || track.channelTitle || 'Unknown Artist';
  const thumbnail = track.thumbnails?.default?.url || track.thumbnail || track.thumbnails?.default || '';
  const durationText = track.durationText || (track.duration ? formatDuration(track.duration) : '');

  const handlePlay = () => {
    if (typeof window !== 'undefined' && (window as any).playVideoSync) {
      if (isCurrentTrack) {
        if (!isPlaying) {
          (window as any).playVideoSync();
        }
      } else {
        (window as any).playVideoSync(track.videoId);
      }
    } else if (typeof window !== 'undefined' && (window as any).playSilentAudio) {
      (window as any).playSilentAudio();
    }
    
    if (isCurrentTrack) {
      togglePlay();
    } else {
      if (contextTracks && contextTracks.length > 0) {
        const playlist = contextTracks.map(t => ({
          videoId: t.videoId,
          title: t.title || 'Unknown Title',
          artist: t.artist || t.channelName || t.channelTitle || 'Unknown Artist',
          channelId: t.channelId || '',
          thumbnails: { 
            default: t.thumbnails?.default?.url || t.thumbnail || t.thumbnails?.default || '',
            medium: t.thumbnails?.medium?.url || t.thumbnail || t.thumbnails?.default || '',
            high: t.thumbnails?.high?.url || t.thumbnail || t.thumbnails?.default || '',
            maxres: t.thumbnails?.maxres?.url || t.thumbnail || t.thumbnails?.default || ''
          },
          duration: t.duration || 0,
          durationText: t.durationText || (t.duration ? formatDuration(t.duration) : ''),
          tags: [],
          playCount: 0,
          likeCount: 0,
          cachedAt: new Date().toISOString()
        }));
        
        const startIndex = index !== undefined ? index : playlist.findIndex(t => t.videoId === track.videoId);
        const currentTrackToPlay = loadPlaylist(playlist, Math.max(0, startIndex));
        if (currentTrackToPlay) setCurrentTrack(currentTrackToPlay);
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
          cachedAt: new Date().toISOString()
        } as any;
        const currentTrackToPlay = loadPlaylist([trackData], 0);
        if (currentTrackToPlay) {
          setCurrentTrack(currentTrackToPlay);
        }
      }
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track })
      });
      if (res.ok) {
        toast.success('Added to playlist');
      } else {
        toast.error('Failed to add to playlist');
      }
    } catch (error) {
      toast.error('Error adding to playlist');
    }
  };

  return (
    <div 
      className={cn(
        "group flex items-center gap-2 px-1 py-1 rounded hover:bg-black/5 transition-colors cursor-pointer",
        isCurrentTrack && "bg-black/5"
      )}
      onClick={handlePlay}
    >
      {/* Index or Play Button */}
      {index !== undefined && (
        <div className="w-6 text-center text-xs text-muted-foreground flex items-center justify-center relative">
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
            "h-3.5 w-3.5 absolute opacity-0 group-hover:opacity-100 fill-current",
            isCurrentTrack && "text-brand-primary"
          )} />
        </div>
      )}

      {/* Cover */}
      {showCover && (
        <div className="relative h-9 w-9 flex-shrink-0 bg-muted rounded overflow-hidden">
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
      <div className="flex items-center gap-1 transition-opacity">
        <LikeButton videoId={track.videoId} />
        
        <span className="text-xs text-muted-foreground min-w-[32px] text-right hidden sm:block">
          {durationText}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-md border border-black/10 shadow-lg z-[100]">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* Add to queue logic */ }}>
              Add to queue
            </DropdownMenuItem>
            {playlists && playlists.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Add to playlist</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-white/95 backdrop-blur-md border border-black/10 shadow-lg z-[100]">
                  {playlists.map((pl: any) => (
                    <DropdownMenuItem key={pl._id} onClick={(e) => { e.stopPropagation(); handleAddToPlaylist(pl._id); }}>
                      {pl.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
              Go to artist
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
              Share
            </DropdownMenuItem>
            {onRemove && (
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="text-red-500 focus:text-red-500"
              >
                Remove
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
