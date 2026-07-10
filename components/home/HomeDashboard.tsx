'use client';

import useSWR from 'swr';
import { Play, Plus, Heart, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueueStore } from '@/store/queueStore';
import { usePlayerStore } from '@/store/playerStore';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function HomeDashboard() {
  const { data, error, isLoading } = useSWR('/api/recommendations', fetcher);
  const { data: playlists } = useSWR('/api/playlists', fetcher);
  const { loadPlaylist, shuffleQueue } = useQueueStore();
  const { setCurrentTrack } = usePlayerStore();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="h-10 w-64 bg-surface rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-surface rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground font-semibold">
        Failed to load recommendations.
      </div>
    );
  }

  const { madeForYou } = data;

  const handlePlayTrack = (track: any) => {
    const nextTrack = loadPlaylist([track], 0);
    if (nextTrack) setCurrentTrack(nextTrack);
  };

  const handleShufflePlaylist = (playlist: any) => {
    if (playlist.tracks && playlist.tracks.length > 0) {
      const shuffledTracks = [...playlist.tracks].sort(() => Math.random() - 0.5);
      const nextTrack = loadPlaylist(shuffledTracks, 0);
      shuffleQueue();
      if (nextTrack) setCurrentTrack(nextTrack);
    }
  };

  return (
    <div className="flex flex-col gap-10">

      {/* Made for You Grid */}
      {madeForYou && madeForYou.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">Based on your recent listening</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {madeForYou.map((item: any, index: number) => (
              <div
                key={`made-${item.id}`}
                onClick={() => handlePlayTrack(item.data)}
                className="group relative overflow-hidden rounded-xl clay-card cursor-pointer flex flex-col p-2"
              >
                <div className="relative aspect-square w-full rounded-lg overflow-hidden clay-inset bg-brand-primary/10 flex items-center justify-center">
                  <Play className="absolute h-12 w-12 text-brand-primary/30 z-0" />
                  {item.imageUrl && (
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                      className="absolute inset-0 object-cover w-full h-full transition-all duration-500 group-hover:scale-105 z-10" 
                    />
                  )}
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="icon"
                      className="h-16 w-16 bg-white text-brand-primary rounded-full shadow-xl hover:scale-110 transition-transform"
                      onClick={(e) => { e.stopPropagation(); handlePlayTrack(item.data); }}
                    >
                      <Play className="fill-current h-8 w-8 ml-1" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 flex flex-col">
                  <h3 className="font-bold text-foreground truncate text-base mb-1">{item.title}</h3>
                  <p className="text-muted-foreground font-semibold line-clamp-2 text-xs">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Your Playlists Grid */}
      <section>
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">Your Playlists</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          
          {/* Liked Songs Card */}
          <div
            onClick={() => router.push('/collection/tracks')}
            className="group relative rounded-xl clay-card cursor-pointer flex flex-col p-2 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20"
          >
            <div className="relative aspect-square w-full rounded-lg overflow-hidden flex items-center justify-center">
              <Heart className="h-12 w-12 text-brand-primary fill-brand-primary drop-shadow-md group-hover:scale-110 transition-transform" />
            </div>
            <div className="p-3 flex flex-col">
              <h3 className="font-bold text-foreground text-base truncate">Liked Songs</h3>
              <p className="text-muted-foreground font-semibold text-xs">Your favorite tracks</p>
            </div>
          </div>

          {/* User Playlists */}
          {Array.isArray(playlists) && playlists.map((pl: any) => (
            <div
              key={`pl-${pl._id}`}
              onClick={() => router.push(`/playlist/${pl._id}`)}
              className="group relative rounded-xl clay-card cursor-pointer flex flex-col p-2"
            >
              <div className="relative aspect-square w-full rounded-lg overflow-hidden clay-inset bg-brand-secondary/10 flex items-center justify-center">
                <Play className="absolute h-12 w-12 text-brand-secondary/30 z-0" />
                {(() => {
                  const hasTracks = pl.tracks && pl.tracks.length > 0;
                  const firstTrack = hasTracks ? pl.tracks[0] : null;
                  const imgSrc = firstTrack ? (typeof firstTrack.thumbnails?.high === 'string' ? firstTrack.thumbnails.high : (firstTrack.thumbnails?.high as any)?.url || typeof firstTrack.thumbnails?.default === 'string' ? firstTrack.thumbnails.default : (firstTrack.thumbnails?.default as any)?.url || '') : null;

                  return imgSrc ? (
                    <img 
                      src={imgSrc} 
                      alt={pl.name} 
                      onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                      className="absolute inset-0 object-cover w-full h-full opacity-90 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105 z-10" 
                    />
                  ) : null;
                })()}

                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="icon"
                    className="h-12 w-12 bg-white text-brand-secondary rounded-full shadow-xl hover:scale-110 transition-transform"
                    onClick={(e) => { e.stopPropagation(); handleShufflePlaylist(pl); }}
                    disabled={!pl.tracks || pl.tracks.length === 0}
                  >
                    <Shuffle className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="p-3 flex flex-col">
                <h3 className="font-bold text-foreground text-base truncate">{pl.name}</h3>
                <p className="text-muted-foreground font-semibold text-xs">
                  {pl.tracks?.length || 0} tracks
                </p>
              </div>
            </div>
          ))}
          
          {/* Create New Playlist Card */}
          <div className="group rounded-xl clay-card cursor-pointer flex flex-col p-2 border-2 border-dashed border-border hover:border-brand-primary bg-transparent shadow-none">
            <div className="relative aspect-square w-full rounded-lg overflow-hidden flex items-center justify-center">
              <div className="h-12 w-12 rounded-full clay-btn flex items-center justify-center text-muted-foreground group-hover:text-brand-primary group-hover:scale-110 transition-all duration-300">
                <Plus className="h-6 w-6" />
              </div>
            </div>
            <div className="p-3 flex flex-col items-center">
              <h3 className="font-bold text-muted-foreground group-hover:text-brand-primary text-base transition-colors">Create New</h3>
            </div>
          </div>
          
        </div>
      </section>

    </div>
  );
}
