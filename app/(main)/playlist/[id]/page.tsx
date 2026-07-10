'use client';

import useSWR from 'swr';
import { useParams } from 'next/navigation';
import { TrackRow } from '@/components/music/TrackRow';
import { Play, Shuffle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueueStore } from '@/store/queueStore';
import { usePlayerStore } from '@/store/playerStore';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PlaylistPage() {
  const params = useParams();
  const id = params.id as string;
  
  const { data: playlist, error, isLoading } = useSWR(id ? `/api/playlists/${id}` : null, fetcher);
  const { loadPlaylist, shuffleQueue } = useQueueStore();
  const { setCurrentTrack } = usePlayerStore();

  const handlePlayAll = () => {
    if (playlist?.tracks && playlist.tracks.length > 0) {
      const nextTrack = loadPlaylist(playlist.tracks, 0);
      if (nextTrack) setCurrentTrack(nextTrack);
    }
  };

  const handleShuffle = () => {
    if (playlist?.tracks && playlist.tracks.length > 0) {
      const shuffledTracks = [...playlist.tracks].sort(() => Math.random() - 0.5);
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

  if (error || !playlist) {
    return (
      <div className="clay-card p-12 text-center mt-12">
        <h3 className="text-xl font-bold text-destructive">Playlist not found or error loading.</h3>
      </div>
    );
  }

  const hasTracks = playlist.tracks && playlist.tracks.length > 0;
  const firstTrack = hasTracks ? playlist.tracks[0] : null;
  const imgSrc = firstTrack ? (typeof firstTrack.thumbnails?.high === 'string' ? firstTrack.thumbnails.high : (firstTrack.thumbnails?.high as any)?.url || typeof firstTrack.thumbnails?.default === 'string' ? firstTrack.thumbnails.default : (firstTrack.thumbnails?.default as any)?.url || '') : null;

  return (
    <div className="py-6 flex flex-col gap-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-end gap-6 md:gap-10">
        <div className="relative h-48 w-48 md:h-64 md:w-64 shrink-0 clay-panel overflow-hidden">
          {imgSrc ? (
            <img src={imgSrc} alt={playlist.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-brand-primary/10">
              <Play className="h-20 w-20 text-brand-primary/30" />
            </div>
          )}
        </div>
        <div className="flex flex-col flex-1 pb-2">
          <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Playlist</span>
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 line-clamp-2">{playlist.name}</h1>
          <p className="text-muted-foreground font-semibold">
            {playlist.tracks?.length || 0} tracks
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-4 py-4">
        <Button 
          size="icon" 
          className="h-14 w-14 rounded-full bg-brand-primary text-white shadow-brand hover:scale-105"
          onClick={handlePlayAll}
          disabled={!hasTracks}
        >
          <Play className="h-6 w-6 fill-current ml-1" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-14 w-14 rounded-full text-muted-foreground hover:text-brand-primary"
          onClick={handleShuffle}
          disabled={!hasTracks}
        >
          <Shuffle className="h-6 w-6" />
        </Button>
      </div>

      {/* Track List */}
      <div>
        <div className="flex items-center px-4 py-2 text-sm font-bold text-muted-foreground border-b border-border/50 mb-4">
          <div className="w-8 text-center">#</div>
          <div className="flex-1">Title</div>
          <div className="w-12 text-center hidden sm:block"><Clock className="h-4 w-4 mx-auto" /></div>
          <div className="w-10"></div>
        </div>
        
        {!hasTracks ? (
          <div className="clay-card p-12 text-center mt-4">
            <h3 className="text-xl font-bold text-muted-foreground">This playlist is empty.</h3>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {playlist.tracks.map((track: any, i: number) => (
              <TrackRow 
                key={`${track.videoId}-${i}`} 
                track={track} 
                index={i}
                contextTracks={playlist.tracks}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
