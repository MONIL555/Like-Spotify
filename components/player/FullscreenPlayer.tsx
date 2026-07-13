'use client';

import { useState, useEffect } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { PlayerControls } from './PlayerControls';
import { ProgressBar } from './ProgressBar';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { LikeButton } from '@/components/music/LikeButton';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import Image from 'next/image';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function FullscreenPlayer() {
  const { currentTrack, isFullscreen, toggleFullscreen } = usePlayerStore();
  const [viewMode, setViewMode] = useState<'cover' | 'lyrics'>('cover');

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      // Reset view mode when exiting fullscreen
      setTimeout(() => setViewMode('cover'), 300);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const { data: lyricsData, isLoading: lyricsLoading } = useSWR(
    currentTrack ? `/api/lyrics?track=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist || currentTrack.channelTitle || '')}` : null,
    fetcher
  );

  if (!currentTrack || !isFullscreen) return null;

  const thumbnail = typeof currentTrack.thumbnails?.high === 'string' 
    ? currentTrack.thumbnails.high 
    : (currentTrack.thumbnails?.high as any)?.url || 
      (typeof currentTrack.thumbnails?.default === 'string' 
        ? currentTrack.thumbnails.default 
        : (currentTrack.thumbnails?.default as any)?.url) || '';

  return (
    <div className="fixed inset-0 z-[100] bg-[#121212] animate-slide-up flex flex-col font-sans">
      {/* Dynamic Background Blur - More premium scale and opacity */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 opacity-40 blur-[100px] scale-125 pointer-events-none transition-all duration-1000"
          style={{
            backgroundImage: `url(${thumbnail})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Subtle gradient overlay to ensure text is always readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />
      </div>
      
      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleFullscreen}
          className="hover:bg-white/10 rounded-full h-12 w-12 text-white transition-colors"
        >
          <ChevronDown className="h-8 w-8" />
        </Button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-1">
            Now Playing
          </span>
          <span className="text-sm font-semibold text-white/90">
            {currentTrack.artist || currentTrack.channelTitle}
          </span>
        </div>
        <div className="w-12" /> {/* Spacer */}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col p-6 max-w-md mx-auto w-full gap-8">
        
        {/* 3D Flip Card (Cover / Lyrics) */}
        <div className="w-full flex-1 flex items-center justify-center min-h-0 relative [perspective:1200px]">
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.x < -60 && viewMode === 'cover') {
                setViewMode('lyrics');
              } else if (info.offset.x > 60 && viewMode === 'lyrics') {
                setViewMode('cover');
              }
            }}
            initial={false}
            animate={{ rotateY: viewMode === 'lyrics' ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            style={{ transformStyle: 'preserve-3d' }}
            className="w-full aspect-square relative cursor-grab active:cursor-grabbing"
          >
            {/* Front Face: Cover */}
            <div 
              className="absolute inset-0 w-full h-full rounded-[32px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <Image 
                src={thumbnail} 
                alt={currentTrack.title} 
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                draggable={false}
                priority
              />
              <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] rounded-[32px] pointer-events-none" />
              <div className="absolute bottom-4 right-6 pointer-events-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md">
                  Swipe for Lyrics
                </span>
              </div>
            </div>

            {/* Back Face: Lyrics */}
            <div 
              className="absolute inset-0 w-full h-full rounded-[32px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] bg-white/5 backdrop-blur-3xl flex flex-col p-6 border border-white/10"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white tracking-tight">Lyrics</h3>
                <span className="text-xs font-bold uppercase tracking-wider text-white/50">Swipe Back</span>
              </div>
              <div 
                className="flex-1 overflow-y-auto hide-scrollbar scroll-smooth"
                onPointerDown={(e) => {
                  // Stop drag propagation when scrolling vertically
                  e.stopPropagation();
                }}
              >
                {lyricsLoading ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4">
                    <div className="h-8 w-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : lyricsData && (lyricsData.plainLyrics || lyricsData.syncedLyrics) ? (
                  <div className="whitespace-pre-wrap text-xl md:text-2xl font-bold leading-[1.6] text-white/90 pb-8 text-center pt-2">
                    {lyricsData.plainLyrics || "Synced lyrics coming soon..."}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-white/50 font-medium text-center">
                    Looks like we don't have lyrics for this track yet.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Info & Controls Wrapper (Bottom Area) */}
        <div className="w-full flex flex-col gap-6 mt-auto">
          {/* Track Info */}
          <div className="w-full flex items-center justify-between">
            <div className="flex flex-col overflow-hidden pr-4">
              <h1 className="text-2xl md:text-3xl font-bold text-white truncate tracking-tight">
                {currentTrack.title}
              </h1>
              <h2 className="text-lg md:text-xl font-medium text-white/60 truncate mt-1">
                {currentTrack.artist || currentTrack.channelTitle}
              </h2>
            </div>
            <LikeButton videoId={currentTrack.videoId} className="h-12 w-12 text-white shrink-0 hover:bg-white/10 rounded-full transition-colors" />
          </div>

          {/* Progress & Player Controls */}
          <div className="w-full flex flex-col gap-5">
            <ProgressBar />
            
            <div className="w-full pt-2 pb-6">
              <PlayerControls />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
