'use client';

import useSWR from 'swr';
import { TrackRow } from '@/components/music/TrackRow';
import { Play, Shuffle, Clock, Loader2, Heart } from 'lucide-react';
import { Skeleton, TrackSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useQueueStore } from '@/store/queueStore';
import { usePlayerStore } from '@/store/playerStore';
import { formatTotalDuration } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function LikedSongsPage() {
  const { data, error, isLoading } = useSWR('/api/library/liked', fetcher);
  const { loadPlaylist, shuffleQueue } = useQueueStore();
  const { setCurrentTrack } = usePlayerStore();

  const tracks = Array.isArray(data) ? data : (data?.items?.map((item: any) => item.track) || []);
  const totalDuration = tracks.reduce((acc: number, track: any) => acc + (track.duration || 0), 0);

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      const nextTrack = loadPlaylist(tracks, 0, 'playlist');
      if (nextTrack) setCurrentTrack(nextTrack);
    }
  };

  const handleShuffle = () => {
    if (tracks.length > 0) {
      const shuffledTracks = [...tracks].sort(() => Math.random() - 0.5);
      const nextTrack = loadPlaylist(shuffledTracks, 0, 'playlist');
      shuffleQueue();
      if (nextTrack) setCurrentTrack(nextTrack);
    }
  };

  if (isLoading) {
    return (
      <div className="py-6 flex flex-col gap-8 animate-fade-in">
        <div className="flex flex-row items-center md:items-end gap-4 md:gap-8">
          <Skeleton className="h-28 w-28 md:h-56 md:w-56 shrink-0 rounded-xl" />
          <div className="flex flex-col flex-1 pb-1 md:pb-2 gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 md:h-12 w-3/4 max-w-[400px]" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
        <div className="flex items-center gap-3 py-2 md:py-4">
          <Skeleton className="h-12 w-12 md:h-14 md:w-14 rounded-full" />
          <Skeleton className="h-12 w-12 md:h-14 md:w-14 rounded-full" />
        </div>
        <div className="mt-2 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <TrackSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="clay-card p-12 text-center mt-12">
        <h3 className="text-xl font-bold text-destructive">Error loading Liked Songs.</h3>
      </div>
    );
  }

  return (
    <div className="py-6 flex flex-col gap-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-row items-center md:items-end gap-4 md:gap-8">
        <div className="relative h-28 w-28 md:h-56 md:w-56 shrink-0 clay-panel overflow-hidden bg-gradient-to-br from-brand-primary/80 to-brand-secondary/80 flex items-center justify-center">
          <Heart className="h-12 w-12 md:h-24 md:w-24 text-white fill-white drop-shadow-md" />
        </div>
        <div className="flex flex-col flex-1 pb-1 md:pb-2">
          <span className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Playlist</span>
          <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold text-foreground mb-2 md:mb-4 line-clamp-2">Liked Songs</h1>
          <p className="text-sm md:text-base text-muted-foreground font-semibold">
            {tracks.length} songs • {formatTotalDuration(totalDuration)}
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-3 py-2 md:py-4">
        <Button 
          size="icon" 
          className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-brand-primary text-white shadow-brand hover:scale-105"
          onClick={handlePlayAll}
          disabled={tracks.length === 0}
        >
          <Play className="h-5 w-5 md:h-6 md:w-6 fill-current ml-1" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-12 w-12 md:h-14 md:w-14 rounded-full text-muted-foreground hover:text-brand-primary"
          onClick={handleShuffle}
          disabled={tracks.length === 0}
        >
          <Shuffle className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
      </div>

      {/* Track List */}
      <div>
        <div className="flex items-center px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm font-bold text-muted-foreground border-b border-border/50 mb-2 md:mb-4">
          <div className="w-8 text-center">#</div>
          <div className="flex-1">Title</div>
          <div className="w-12 text-center hidden sm:block"><Clock className="h-3 w-3 md:h-4 md:w-4 mx-auto" /></div>
          <div className="w-8 md:w-10"></div>
        </div>
        
        {tracks.length === 0 ? (
          <div className="clay-card p-12 text-center mt-4">
            <h3 className="text-xl font-bold text-muted-foreground">You haven't liked any songs yet.</h3>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {tracks.map((track: any, i: number) => (
              <TrackRow 
                key={`${track.videoId}-${i}`} 
                track={track} 
                index={i}
                contextTracks={tracks}
                isPlaylistContext={true}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
