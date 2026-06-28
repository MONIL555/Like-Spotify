'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { Loader2, Clock } from 'lucide-react';
import { PlaylistHeader } from '@/components/music/PlaylistHeader';
import { TrackRow } from '@/components/music/TrackRow';
import { useQueueStore } from '@/store/queueStore';

// Note: For full Drag and Drop reordering, we would implement @dnd-kit/core here.
// For brevity in this initial implementation, we will render the list standardly.

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PlaylistPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: playlist, error, isLoading } = useSWR(id ? `/api/playlists/${id}` : null, fetcher);
  const { loadPlaylist } = useQueueStore();

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full pb-8 w-full">
        <div className="flex flex-col md:flex-row items-end gap-6 p-6 md:p-8 bg-gradient-to-b from-surface to-background animate-pulse">
          <div className="w-48 h-48 md:w-60 md:h-60 bg-muted shadow-2xl flex-shrink-0" />
          <div className="flex flex-col gap-4 w-full">
            <div className="h-4 w-24 bg-muted rounded hidden md:block" />
            <div className="h-12 w-3/4 bg-muted rounded" />
            <div className="h-4 w-1/3 bg-muted rounded" />
          </div>
        </div>
        <div className="px-6 md:px-8 mt-6 w-full">
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-2 opacity-50">
                <div className="w-10 h-10 bg-muted rounded animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-1/4 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] flex-col gap-4 text-muted-foreground">
        <p>Playlist not found.</p>
      </div>
    );
  }

  const handlePlayAll = () => {
    if (playlist.tracks && playlist.tracks.length > 0) {
      loadPlaylist(playlist.tracks, 0);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-8">
      <PlaylistHeader
        type="Playlist"
        title={playlist.name}
        subtitle={playlist.owner?.displayName || 'User'}
        description={playlist.description}
        imageUrl={playlist.coverImageUrl}
        stats={`${playlist.tracks?.length || 0} songs`}
        onPlay={handlePlayAll}
      />

      {/* Track List Header */}
      <div className="px-6 md:px-8 mt-6">
        <div className="flex items-center gap-4 px-4 py-2 border-b border-border/50 text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
          <div className="w-8 text-center">#</div>
          <div className="flex-1">Title</div>
          <div className="w-12 text-right hidden sm:block">
            <Clock className="h-4 w-4 ml-auto inline-block" />
          </div>
        </div>

        {/* Tracks */}
        {playlist.tracks && playlist.tracks.length > 0 ? (
          <div className="flex flex-col">
            {playlist.tracks.map((track: any, index: number) => (
              <TrackRow 
                key={`${track.videoId}-${index}`} 
                track={track} 
                index={index} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center p-12 text-muted-foreground">
            <h3 className="text-xl font-bold text-foreground mb-2">It's a bit empty here...</h3>
            <p>Let's find some songs for your playlist.</p>
          </div>
        )}
      </div>
    </div>
  );
}
