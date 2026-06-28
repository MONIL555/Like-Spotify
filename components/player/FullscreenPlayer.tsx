'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { Minimize2, Maximize2 } from 'lucide-react';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { Button } from '@/components/ui/button';
import { PlayerControls } from './PlayerControls';
import { ProgressBar } from './ProgressBar';
import { VolumeControl } from './VolumeControl';
import { cn } from '@/lib/utils';

export function FullscreenPlayer() {
  const { currentTrack, toggleFullscreen } = useYouTubePlayer();

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleFullscreen();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen]);

  if (!currentTrack) return null;

  // Use the highest resolution thumbnail available
  const thumbnail = 
    currentTrack.thumbnails?.maxres || 
    currentTrack.thumbnails?.high || 
    currentTrack.thumbnails?.medium || 
    '';

  return (
    <div className="fixed inset-0 z-[100] bg-background animate-in fade-in zoom-in-95 duration-200">
      {/* Blurred background image */}
      <div 
        className="absolute inset-0 opacity-30 bg-cover bg-center bg-no-repeat blur-3xl scale-110"
        style={{ backgroundImage: `url(${thumbnail})` }}
      />
      
      {/* Gradient overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background/90" />

      {/* Content */}
      <div className="relative h-full flex flex-col p-8 md:p-12">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-brand-primary"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            <span className="font-semibold tracking-tight text-foreground">SoundWave</span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="text-muted-foreground hover:text-foreground"
          >
            <Minimize2 className="h-6 w-6" />
          </Button>
        </div>

        {/* Center content (Album Art) */}
        <div className="flex-1 flex items-center justify-center min-h-0 mb-8">
          <div className="relative w-full max-w-2xl aspect-video rounded-xl overflow-hidden shadow-2xl">
            {thumbnail && (
              <Image
                src={thumbnail}
                alt={currentTrack.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
                priority
              />
            )}
          </div>
        </div>

        {/* Bottom controls area */}
        <div className="w-full max-w-4xl mx-auto space-y-6">
          {/* Track Info */}
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-2 line-clamp-1">
                {currentTrack.title}
              </h1>
              <p className="text-xl text-muted-foreground line-clamp-1">
                {currentTrack.artist}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4">
            <ProgressBar />
            <div className="flex items-center justify-between">
              <div className="w-[30%] min-w-[180px]">
                {/* Empty space to balance VolumeControl */}
              </div>
              <div className="flex-1 flex justify-center">
                <PlayerControls />
              </div>
              <VolumeControl />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
