'use client';

import useSWR from 'swr';
import { Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueueStore } from '@/store/queueStore';
import { usePlayerStore } from '@/store/playerStore';
import { CreatePlaylistModal } from '@/components/modals/CreatePlaylistModal';
import { Shuffle, Plus, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function HomeDashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data, error, isLoading } = useSWR('/api/recommendations', fetcher);
  const { data: playlists, isLoading: playlistsLoading } = useSWR('/api/playlists', fetcher);
  const { loadPlaylist, shuffleQueue } = useQueueStore();
  const { setCurrentTrack } = usePlayerStore();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 animate-fade-in p-6">
        <div className="h-10 w-64 bg-white/5 rounded-lg animate-pulse mb-2" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-white/50">
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
    <div className="flex flex-col gap-6 animate-fade-in-up p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto">

      {/* Bento Grid: Made for You */}
      {madeForYou && madeForYou.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold tracking-tight text-white/90">Based on your recent listening</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {madeForYou.map((item: any, index: number) => (
              <div
                key={`made-${item.id}`}
                onClick={() => handlePlayTrack(item.data)}
                className={cn(
                  "group relative overflow-hidden rounded-3xl glass-card cursor-pointer flex flex-col hover:shadow-neon",
                  index === 0 && "col-span-2 row-span-2 sm:col-span-2 sm:row-span-2"
                )}
              >
                <div className="relative aspect-square w-full bg-black/20">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="h-12 w-12 text-white/20" />
                    </div>
                  )}
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90"></div>

                  {/* Content Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-3 md:p-4 flex flex-col justify-end">
                    <h3 className={cn(
                      "font-bold text-white drop-shadow-md truncate",
                      index === 0 ? "text-2xl md:text-3xl mb-1" : "text-base md:text-lg"
                    )}>{item.title}</h3>
                    <p className={cn(
                      "text-white/70 line-clamp-1",
                      index === 0 ? "text-sm md:text-base" : "text-xs md:text-sm"
                    )}>
                      {item.description}
                    </p>
                  </div>

                  {/* Play Button Overlay */}
                  <div className="absolute top-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <Button
                      size="icon"
                      className={cn(
                        "bg-white text-black rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-105 hover:bg-white/90",
                        index === 0 ? "h-14 w-14" : "h-10 w-10"
                      )}
                      onClick={(e) => { e.stopPropagation(); handlePlayTrack(item.data); }}
                    >
                      <Play className={cn("fill-current ml-1", index === 0 ? "h-6 w-6" : "h-4 w-4")} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bento Grid: Your Playlists */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-white/90">Your Playlists</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {/* Create New Playlist Card */}
          <div
            onClick={() => setIsCreateModalOpen(true)}
            className="group aspect-square rounded-3xl glass-card cursor-pointer flex flex-col items-center justify-center gap-4 hover:shadow-neon border-dashed border-2 border-white/10 hover:border-accent-coral/50 transition-colors bg-white/5"
          >
            <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center text-white/50 group-hover:text-accent-coral group-hover:scale-110 group-hover:bg-accent-coral/20 transition-all duration-300">
              <Plus className="h-6 w-6" />
            </div>
            <span className="font-bold text-white/50 group-hover:text-white transition-colors">Create New</span>
          </div>

          {/* Liked Songs Card */}
          <div
            onClick={() => router.push('/collection/tracks')}
            className="group relative aspect-square overflow-hidden rounded-3xl glass-card cursor-pointer flex flex-col hover:shadow-neon"
          >
            <div className="relative w-full h-full bg-gradient-to-br from-indigo-500 to-indigo-300 flex items-center justify-center">
              <Heart className="h-12 w-12 text-white fill-white drop-shadow-md" />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

              {/* Content */}
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 flex flex-col justify-end">
                <h3 className="font-bold text-white drop-shadow-md text-base md:text-lg truncate">Liked Songs</h3>
                <p className="text-white/70 text-xs md:text-sm">
                  Your favorite tracks
                </p>
              </div>

              {/* Play Button Overlay */}
              <div className="absolute top-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <Button
                  size="icon"
                  className="bg-white text-black rounded-full h-10 w-10 shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-105 hover:bg-white/90"
                  onClick={(e) => { e.stopPropagation(); router.push('/collection/tracks'); }}
                  title="Go to Liked Songs"
                >
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* User Playlists */}
          {Array.isArray(playlists) && playlists.map((pl: any) => (
            <div
              key={`pl-${pl._id}`}
              onClick={() => router.push(`/playlist/${pl._id}`)}
              className="group relative aspect-square overflow-hidden rounded-3xl glass-card cursor-pointer flex flex-col hover:shadow-neon"
            >
              <div className="relative w-full h-full bg-gradient-brand flex items-center justify-center">
                {(() => {
                  const hasTracks = pl.tracks && pl.tracks.length > 0;
                  const firstTrack = hasTracks ? pl.tracks[0] : null;
                  const imgSrc = firstTrack ? (firstTrack.thumbnails?.high?.url || firstTrack.thumbnails?.default?.url || firstTrack.thumbnails?.high || firstTrack.thumbnails?.default || firstTrack.thumbnail) : null;

                  return imgSrc ? (
                    <img src={imgSrc} alt={pl.name} className="object-cover w-full h-full mix-blend-overlay opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                  ) : (
                    <Play className="h-12 w-12 text-white/20" />
                  );
                })()}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 flex flex-col justify-end">
                  <h3 className="font-bold text-white drop-shadow-md text-base md:text-lg truncate">{pl.name}</h3>
                  <p className="text-white/70 text-xs md:text-sm">
                    {pl.tracks?.length || 0} tracks
                  </p>
                </div>

                {/* Play Button Overlay */}
                <div className="absolute top-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <Button
                    size="icon"
                    className="bg-white text-black rounded-full h-10 w-10 shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-105 hover:bg-white/90"
                    onClick={(e) => { e.stopPropagation(); handleShufflePlaylist(pl); }}
                    title="Shuffle Play"
                    disabled={!pl.tracks || pl.tracks.length === 0}
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
