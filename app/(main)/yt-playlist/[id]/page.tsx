'use client';

import useSWR from 'swr';
import { useParams } from 'next/navigation';
import { TrackRow } from '@/components/music/TrackRow';
import { Play, Shuffle, Clock, Loader2, Music2 } from 'lucide-react';
import { Skeleton, TrackSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useQueueStore } from '@/store/queueStore';
import { usePlayerStore } from '@/store/playerStore';
import Image from 'next/image';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function YTPlaylistPage() {
  const params = useParams();
  const id = params.id as string;
  
  const { data: playlist, error, isLoading } = useSWR(id ? `/api/yt-playlist/${id}` : null, fetcher);
  const { loadPlaylist, shuffleQueue } = useQueueStore();
  const { setCurrentTrack } = usePlayerStore();

  const handlePlayAll = () => {
    if (playlist?.tracks && playlist.tracks.length > 0) {
      const nextTrack = loadPlaylist(playlist.tracks, 0, 'playlist');
      if (nextTrack) setCurrentTrack(nextTrack);
    }
  };

  const handleShuffle = () => {
    if (playlist?.tracks && playlist.tracks.length > 0) {
      const shuffledTracks = [...playlist.tracks].sort(() => Math.random() - 0.5);
      const nextTrack = loadPlaylist(shuffledTracks, 0, 'playlist');
      shuffleQueue();
      if (nextTrack) setCurrentTrack(nextTrack);
    }
  };

  if (isLoading) {
    return (
      <div className="py-4 flex flex-col gap-6 animate-fade-in">
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

  if (error || !playlist) {
    return (
      <div className="clay-card p-12 text-center mt-12">
        <h3 className="text-xl font-bold text-destructive">Playlist not found or error loading.</h3>
      </div>
    );
  }

  const hasTracks = playlist?.tracks && playlist.tracks.length > 0;
  const firstTrack = hasTracks ? playlist.tracks[0] : null;
  const imgSrc = firstTrack?.thumbnail || null;

  return (
    <div className="py-4 flex flex-col gap-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-row items-center md:items-end gap-4 md:gap-8">
        <div className="relative h-28 w-28 md:h-56 md:w-56 shrink-0 clay-panel overflow-hidden shadow-2xl rounded-[32px] bg-white/5">
          {imgSrc ? (
            <Image src={imgSrc} alt={playlist.name} fill priority sizes="(max-width: 768px) 112px, 224px" className="object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-brand-primary/10">
              <Music2 className="h-12 w-12 md:h-20 md:w-20 text-brand-primary/30" />
            </div>
          )}
        </div>
        <div className="flex flex-col flex-1 pb-1 md:pb-2">
          <span className="text-xs md:text-sm font-bold text-brand-primary uppercase tracking-wider mb-1">YouTube Playlist</span>
          <h1 className="text-2xl md:text-5xl lg:text-6xl font-black text-foreground mb-2 md:mb-4 line-clamp-2 tracking-tight">{playlist.name}</h1>
          <p className="text-sm md:text-base text-muted-foreground font-semibold">
            {playlist.tracks?.length || 0} tracks • Curated by {playlist.userId}
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-3 py-2 md:py-4">
        <Button 
          size="icon" 
          className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-brand-primary text-white shadow-[0_0_20px_rgba(29,185,84,0.4)] hover:scale-110 transition-transform"
          onClick={handlePlayAll}
          disabled={!hasTracks}
        >
          <Play className="h-6 w-6 md:h-7 md:w-7 fill-current ml-1" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-12 w-12 md:h-14 md:w-14 rounded-full text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
          onClick={handleShuffle}
          disabled={!hasTracks}
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
                isPlaylistContext={true}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
