'use client';

import useSWR from 'swr';
import { useParams } from 'next/navigation';
import { TrackRow } from '@/components/music/TrackRow';
import { Play, Shuffle, Clock, Loader2, Trash2 } from 'lucide-react';
import { Skeleton, TrackSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useQueueStore } from '@/store/queueStore';
import { usePlayerStore } from '@/store/playerStore';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import Image from 'next/image';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PlaylistPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { data: playlist, error, isLoading } = useSWR(id ? `/api/playlists/${id}` : null, fetcher);
  const { loadPlaylist, shuffleQueue } = useQueueStore();
  const { setCurrentTrack } = usePlayerStore();

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Playlist deleted');
        router.push('/');
      } else {
        toast.error('Failed to delete playlist');
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred');
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

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

  const hasTracks = playlist.tracks && playlist.tracks.length > 0;
  const firstTrack = hasTracks ? playlist.tracks[0] : null;
  const imgSrc = firstTrack ? (typeof firstTrack.thumbnails?.high === 'string' ? firstTrack.thumbnails.high : (firstTrack.thumbnails?.high as any)?.url || typeof firstTrack.thumbnails?.default === 'string' ? firstTrack.thumbnails.default : (firstTrack.thumbnails?.default as any)?.url || '') : null;

  return (
    <div className="py-4 flex flex-col gap-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-row items-center md:items-end gap-4 md:gap-8">
        <div className="relative h-28 w-28 md:h-56 md:w-56 shrink-0 clay-panel overflow-hidden">
          {imgSrc ? (
            <Image src={imgSrc} alt={playlist.name} fill priority sizes="(max-width: 768px) 112px, 224px" className="object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-brand-primary/10">
              <Play className="h-12 w-12 md:h-20 md:w-20 text-brand-primary/30" />
            </div>
          )}
        </div>
        <div className="flex flex-col flex-1 pb-1 md:pb-2">
          <span className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Playlist</span>
          <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold text-foreground mb-2 md:mb-4 line-clamp-2">{playlist.name}</h1>
          <p className="text-sm md:text-base text-muted-foreground font-semibold">
            {playlist.tracks?.length || 0} tracks
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between py-2 md:py-4">
        <div className="flex items-center gap-3">
          <Button 
            size="icon" 
            className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-brand-primary text-white shadow-brand hover:scale-105"
            onClick={handlePlayAll}
            disabled={!hasTracks}
          >
            <Play className="h-5 w-5 md:h-6 md:w-6 fill-current ml-1" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-12 w-12 md:h-14 md:w-14 rounded-full text-muted-foreground hover:text-brand-primary"
            onClick={handleShuffle}
            disabled={!hasTracks}
          >
            <Shuffle className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
        </div>
        
        {user?._id === playlist.userId && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleDelete}
            className="h-10 w-10 md:h-12 md:w-12 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Delete Playlist"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogHeader>
          <DialogTitle>Delete Playlist</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{playlist.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="default" className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
