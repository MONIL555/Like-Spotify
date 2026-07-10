'use client';

import useSWR from 'swr';
import { TrackRow } from '@/components/music/TrackRow';
import { Play, Shuffle, Clock, Loader2, Heart } from 'lucide-react';
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
      const nextTrack = loadPlaylist(tracks, 0);
      if (nextTrack) setCurrentTrack(nextTrack);
    }
  };

  const handleShuffle = () => {
    if (tracks.length > 0) {
      const shuffledTracks = [...tracks].sort(() => Math.random() - 0.5);
      const nextTrack = loadPlaylist(shuffledTracks, 0);
      shuffleQueue();
      if (nextTrack) setCurrentTrack(nextTrack);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-brand-primary">
        <Loader2 className="h-12 w-12 animate-spin" />
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
      <div className="flex flex-col md:flex-row items-end gap-6 md:gap-10">
        <div className="relative h-48 w-48 md:h-64 md:w-64 shrink-0 rounded-3xl overflow-hidden bg-gradient-to-br from-brand-primary/80 to-brand-secondary/80 flex items-center justify-center shadow-lg">
          <Heart className="h-24 w-24 text-white fill-white drop-shadow-md" />
        </div>
        <div className="flex flex-col flex-1 pb-2">
          <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Playlist</span>
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 line-clamp-2">Liked Songs</h1>
          <p className="text-muted-foreground font-semibold">
            {tracks.length} songs • {formatTotalDuration(totalDuration)}
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-4 py-4">
        <Button 
          size="icon" 
          className="h-14 w-14 rounded-full bg-brand-primary text-white shadow-brand hover:scale-105"
          onClick={handlePlayAll}
          disabled={tracks.length === 0}
        >
          <Play className="h-6 w-6 fill-current ml-1" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-14 w-14 rounded-full text-muted-foreground hover:text-brand-primary"
          onClick={handleShuffle}
          disabled={tracks.length === 0}
        >
          <Shuffle className="h-6 w-6" />
        </Button>
      </div>

      {/* Track List */}
      <div>
        <div className="flex items-center px-3 py-2 text-xs font-bold text-muted-foreground border-b border-border/50 mb-3">
          <div className="w-11 shrink-0 mr-3"></div>
          <div className="flex-1">Title</div>
          <div className="w-10 text-center hidden sm:block"><Clock className="h-3.5 w-3.5 mx-auto" /></div>
          <div className="w-8"></div>
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
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
