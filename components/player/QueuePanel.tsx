'use client';

import { usePlayerStore } from '@/store/playerStore';
import { useQueueStore } from '@/store/queueStore';
import { X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { formatDuration } from '@/lib/utils';

export function QueuePanel() {
  const { isQueueOpen, toggleQueue, currentTrack, setCurrentTrack } = usePlayerStore();
  const { userQueue, queue, loadPlaylist, playNext } = useQueueStore();

  if (!isQueueOpen) return null;

  const handlePlayFromUserQueue = (track: any, index: number) => {
    // We want to skip ahead to this track in the user queue.
    // Simplest way is to just call playNext until we hit it, or manually set it.
    // For manual set without skipping history cleanly, we can just load it directly.
    // Ideally we should remove it from userQueue.
    const state = useQueueStore.getState();
    const newUserQueue = [...state.userQueue];
    newUserQueue.splice(0, index + 1); // remove all up to and including this track
    useQueueStore.setState({ userQueue: newUserQueue });
    
    if (typeof window !== 'undefined' && (window as any).playVideoSync) {
      (window as any).playVideoSync(track.videoId);
    } else if (typeof window !== 'undefined' && (window as any).playSilentAudio) {
      (window as any).playSilentAudio();
    }
    
    setCurrentTrack(track);
  };

  const handlePlayFromQueue = (track: any, index: number) => {
    // In our queueStore, the 'queue' array represents the entire current playlist context.
    // To play a specific track, we just need to set it as current, and the queueStore handles the rest.
    const newTrack = loadPlaylist(queue, index);
    if (newTrack) {
      if (typeof window !== 'undefined' && (window as any).playVideoSync) {
        (window as any).playVideoSync(newTrack.videoId);
      } else if (typeof window !== 'undefined' && (window as any).playSilentAudio) {
        (window as any).playSilentAudio();
      }
      setCurrentTrack(newTrack);
    }
  };

  const renderTrack = (track: any, index: number, isUserQueue: boolean) => {
    const isCurrent = currentTrack?.videoId === track.videoId;
    return (
      <div 
        key={`${isUserQueue ? 'uq' : 'q'}-${track.videoId}-${index}`}
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group",
          isCurrent ? "clay-inset bg-brand-primary/10" : "hover:bg-surface-hover hover:scale-[1.02]"
        )}
        onClick={() => isUserQueue ? handlePlayFromUserQueue(track, index) : handlePlayFromQueue(track, index)}
      >
        <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden shadow-sm">
          <img 
            src={typeof track.thumbnails?.default === 'string' ? track.thumbnails.default : (track.thumbnails?.default as any)?.url || ''} 
            alt={track.title}
            className={cn("h-full w-full object-cover transition-opacity", !isCurrent && "group-hover:opacity-50")}
          />
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

  const totalTracks = userQueue.length + queue.length;

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
              {userQueue.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-muted-foreground mb-2 px-3 uppercase tracking-wider">Up Next</h3>
                  {userQueue.map((track: any, index: number) => renderTrack(track, index, true))}
                </div>
              )}
              {queue.length > 0 && (
                <div>
                  {userQueue.length > 0 && <h3 className="text-sm font-bold text-muted-foreground mb-2 px-3 uppercase tracking-wider">From Context</h3>}
                  {queue.map((track: any, index: number) => renderTrack(track, index, false))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
