'use client';

import { usePlayerStore } from '@/store/playerStore';
import { PlayerControls } from './PlayerControls';
import { ProgressBar } from './ProgressBar';
import { VolumeControl } from './VolumeControl';
import { Button } from '@/components/ui/button';
import { ChevronDown, ListMusic, Mic2 } from 'lucide-react';
import { LikeButton } from '@/components/music/LikeButton';
import { cn, formatDuration } from '@/lib/utils';
import { useEffect } from 'react';

export function FullscreenPlayer() {
  const { currentTrack, isFullscreen, toggleFullscreen, isLyricsOpen, toggleLyrics, isQueueOpen, toggleQueue } = usePlayerStore();

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  if (!currentTrack || !isFullscreen) return null;

  const thumbnail = typeof currentTrack.thumbnails?.high === 'string' 
    ? currentTrack.thumbnails.high 
    : (currentTrack.thumbnails?.high as any)?.url || 
      (typeof currentTrack.thumbnails?.default === 'string' 
        ? currentTrack.thumbnails.default 
        : (currentTrack.thumbnails?.default as any)?.url) || '';

  return (
    <div className="fixed inset-0 z-[100] bg-black animate-slide-up flex flex-col">
      {/* Dynamic Background Blur */}
      <div 
        className="absolute inset-0 opacity-40 blur-[100px] scale-110 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${thumbnail})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleFullscreen}
          className="hover:bg-white/10 rounded-full h-12 w-12 text-white"
        >
          <ChevronDown className="h-8 w-8" />
        </Button>
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold uppercase tracking-widest text-white/70">Now Playing</span>
          <span className="text-sm font-semibold text-white">{currentTrack.title}</span>
        </div>
        <div className="w-12" /> {/* Spacer */}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full gap-8">
        
        {/* Cover Art */}
        <div className="w-full aspect-square rounded-lg overflow-hidden shadow-2xl relative">
          <img 
            src={thumbnail} 
            alt={currentTrack.title} 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Track Info */}
        <div className="w-full flex items-center justify-between">
          <div className="flex flex-col overflow-hidden">
            <h1 className="text-2xl md:text-3xl font-bold text-white truncate">
              {currentTrack.title}
            </h1>
            <h2 className="text-lg md:text-xl font-medium text-white/70 truncate">
              {currentTrack.artist || currentTrack.channelTitle}
            </h2>
          </div>
          <LikeButton videoId={currentTrack.videoId} className="h-10 w-10 text-white shrink-0" />
        </div>

        {/* Progress & Controls */}
        <div className="w-full flex flex-col gap-2">
          <ProgressBar />
          
          <div className="w-full pt-4 pb-2">
            <PlayerControls />
          </div>
          
          <div className="w-full flex items-center justify-between mt-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLyrics}
              className={cn("h-12 w-12 rounded-full", isLyricsOpen ? "bg-brand-primary text-black hover:bg-brand-primary/90" : "text-white/70 hover:text-white hover:bg-white/10")}
            >
              <Mic2 className="h-5 w-5" />
            </Button>
            
            <div className="w-1/3 min-w-[100px] hidden sm:block">
              <VolumeControl />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleQueue}
              className={cn("h-12 w-12 rounded-full", isQueueOpen ? "bg-brand-primary text-black hover:bg-brand-primary/90" : "text-white/70 hover:text-white hover:bg-white/10")}
            >
              <ListMusic className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
