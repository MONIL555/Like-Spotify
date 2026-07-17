'use client';

import { usePlayerStore } from '@/store/playerStore';
import { useQueueStore } from '@/store/queueStore';
import { X, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { formatDuration } from '@/lib/utils';
import Image from 'next/image';

export function QueuePanel() {
  const { isQueueOpen, toggleQueue, currentTrack, setCurrentTrack } = usePlayerStore();
  const { userQueue, queue, autoplayQueue, playbackSource, loadPlaylist, playNext } = useQueueStore();

  if (!isQueueOpen) return null;

  const handlePlayFromUserQueue = (track: any, index: number) => {
    const state = useQueueStore.getState();
    const newUserQueue = [...state.userQueue];
    newUserQueue.splice(0, index + 1);
    useQueueStore.setState({ userQueue: newUserQueue });
    
    if (typeof window !== 'undefined' && (window as any).playVideoSync) {
      (window as any).playVideoSync(track.videoId);
    } else if (typeof window !== 'undefined' && (window as any).playSilentAudio) {
      (window as any).playSilentAudio();
    }
    
    setCurrentTrack(track);
  };

  const handlePlayFromQueue = (track: any, index: number) => {
    const newTrack = loadPlaylist(queue, index, 'playlist');
    if (newTrack) {
      if (typeof window !== 'undefined' && (window as any).playVideoSync) {
        (window as any).playVideoSync(newTrack.videoId);
      } else if (typeof window !== 'undefined' && (window as any).playSilentAudio) {
        (window as any).playSilentAudio();
      }
      setCurrentTrack(newTrack);
    }
  };

  const handlePlayFromAutoplay = (track: any, index: number) => {
    // Remove tracks before this one from autoplay queue
    const state = useQueueStore.getState();
    const newAutoplayQueue = [...state.autoplayQueue];
    newAutoplayQueue.splice(0, index + 1);
    useQueueStore.setState({ autoplayQueue: newAutoplayQueue });
    
    if (typeof window !== 'undefined' && (window as any).playVideoSync) {
      (window as any).playVideoSync(track.videoId);
    } else if (typeof window !== 'undefined' && (window as any).playSilentAudio) {
      (window as any).playSilentAudio();
    }
    
    setCurrentTrack(track);
  };

  const renderTrack = (track: any, index: number, queueType: 'user' | 'playlist' | 'autoplay') => {
    const isCurrent = currentTrack?.videoId === track.videoId;
    const handleClick = () => {
      if (queueType === 'user') handlePlayFromUserQueue(track, index);
      else if (queueType === 'playlist') handlePlayFromQueue(track, index);
      else handlePlayFromAutoplay(track, index);
    };

    return (
      <div 
        key={`${queueType}-${track.videoId}-${index}`}
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group",
          isCurrent ? "clay-inset bg-brand-primary/10" : "hover:bg-surface-hover hover:scale-[1.02]"
        )}
        onClick={handleClick}
      >
        <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden shadow-sm">
          {typeof track.thumbnails?.default === 'string' && track.thumbnails.default || (track.thumbnails?.default as any)?.url ? (
            <Image 
              src={typeof track.thumbnails?.default === 'string' ? track.thumbnails.default : (track.thumbnails?.default as any)?.url || ''} 
              alt={track.title}
              fill
              sizes="48px"
              className={cn("object-cover transition-opacity", !isCurrent && "group-hover:opacity-50")}
            />
          ) : (
            <div className="w-full h-full bg-surface-hover flex items-center justify-center">
              <span className="text-muted-foreground font-bold">{track.title?.charAt(0)}</span>
            </div>
          )}
          {!isCurrent && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
              <Play className="h-5 w-5 fill-white text-white" />
            </div>
          )}
          {isCurrent && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              {/* Simple EQ animation */}
              <div className="flex items-end gap-[2px] h-4">
                <div className="w-[3px] bg-brand-primary h-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-[3px] bg-brand-primary h-2/3 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-[3px] bg-brand-primary h-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className={cn(
            "truncate font-bold text-sm",
            isCurrent ? "text-brand-primary" : "text-foreground"
          )}>
            {track.title}
          </span>
          <span className="truncate text-xs font-semibold text-muted-foreground">
            {track.artist || track.channelTitle}
          </span>
        </div>
        <span className="text-xs font-bold text-muted-foreground opacity-60 group-hover:opacity-100">
          {formatDuration(track.duration)}
        </span>
      </div>
    );
  };

  const totalTracks = userQueue.length + queue.length + autoplayQueue.length;

  return (
    <div className="fixed top-0 right-0 h-[calc(100vh-100px)] w-full max-w-sm z-40 p-4 md:p-6 animate-fade-in pointer-events-none">
      <div className="clay-panel h-full w-full flex flex-col overflow-hidden pointer-events-auto shadow-2xl bg-surface/95 backdrop-blur-xl border-l-0">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
          <h2 className="text-xl font-bold text-foreground">Next in Queue</h2>
          <Button variant="ghost" size="icon" onClick={toggleQueue} className="h-8 w-8 rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Queue List */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2 hide-scrollbar">
          {totalTracks === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm text-center px-4">
              <p>Your queue is empty.</p>
              <p className="mt-2 opacity-60">Add some tracks or play a playlist to get started.</p>
            </div>
          ) : (
            <>
              {/* User Queue — highest priority */}
              {userQueue.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-muted-foreground mb-2 px-3 uppercase tracking-wider">Up Next</h3>
                  {userQueue.map((track: any, index: number) => renderTrack(track, index, 'user'))}
                </div>
              )}

              {/* Playlist Context — only when playing from a playlist */}
              {playbackSource === 'playlist' && queue.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-muted-foreground mb-2 px-3 uppercase tracking-wider">From Playlist</h3>
                  {queue.map((track: any, index: number) => renderTrack(track, index, 'playlist'))}
                </div>
              )}

              {/* Autoplay Mix — only when playing a single song */}
              {playbackSource === 'single' && autoplayQueue.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-muted-foreground mb-2 px-3 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-brand-primary" />
                    Autoplay Mix
                  </h3>
                  {autoplayQueue.map((track: any, index: number) => renderTrack(track, index, 'autoplay'))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
