'use client';

import useSWR from 'swr';
import { Loader2, Play, Heart } from 'lucide-react';
import { TrackRow } from '@/components/music/TrackRow';
import { Button } from '@/components/ui/button';
import { useQueueStore } from '@/store/queueStore';

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
});

export default function LikedSongsPage() {
  const { data: tracks, error, isLoading } = useSWR('/api/library/liked', fetcher);
  const { loadPlaylist } = useQueueStore();

  const handlePlayAll = () => {
    if (tracks && tracks.length > 0) {
      loadPlaylist(tracks, 0);
    }
  };

  return (
    <div className="flex flex-col animate-fade-in min-h-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-end gap-6 p-6 md:p-8 bg-gradient-to-b from-indigo-800/80 to-background">
        <div className="w-48 h-48 md:w-60 md:h-60 shadow-2xl flex-shrink-0 bg-gradient-to-br from-indigo-500 to-indigo-300 flex items-center justify-center rounded-sm">
          <Heart className="w-24 h-24 text-white fill-white" />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <span className="text-sm font-bold uppercase tracking-wider hidden md:block">Playlist</span>
          <h1 className="text-4xl md:text-7xl font-bold tracking-tighter text-foreground mb-2">
            Liked Songs
          </h1>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span>You</span>
            <span className="w-1 h-1 bg-foreground rounded-full hidden sm:block" />
            <span className="text-muted-foreground">{tracks?.length || 0} songs</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-6 md:px-8 py-4 flex items-center gap-6">
        <Button 
          size="icon" 
          onClick={handlePlayAll}
          disabled={!tracks || tracks.length === 0}
          className="bg-brand-primary text-white rounded-full h-14 w-14 shadow-lg hover:scale-105 hover:bg-brand-hover disabled:opacity-50 disabled:hover:scale-100"
        >
          <Play className="h-6 w-6 fill-current ml-1" />
        </Button>
      </div>

      {/* Track List Header */}
      <div className="px-6 md:px-8">
        <div className="flex items-center gap-4 px-4 py-2 border-b border-border/50 text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
          <div className="w-8 text-center">#</div>
          <div className="flex-1">Title</div>
          <div className="w-12 text-right hidden sm:block">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 ml-auto inline-block"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
        </div>

        {/* Tracks */}
        {isLoading ? (
          <div className="flex flex-col gap-2 pb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-2 opacity-50">
                <div className="w-8 h-4 bg-muted rounded animate-pulse" />
                <div className="w-10 h-10 bg-muted rounded animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-1/4 bg-muted rounded animate-pulse" />
                </div>
                <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center p-12 text-muted-foreground">
            Failed to load liked songs.
          </div>
        ) : tracks && tracks.length > 0 ? (
          <div className="flex flex-col pb-8">
            {tracks.map((track: any, index: number) => (
              <TrackRow 
                key={`${track.videoId}-${index}`} 
                track={track} 
                index={index} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center p-12 text-muted-foreground flex flex-col items-center gap-4">
            <Heart className="h-12 w-12" />
            <h3 className="text-xl font-bold text-foreground">Songs you like will appear here</h3>
            <p>Save songs by tapping the heart icon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
