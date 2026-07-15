'use client';

import { usePlayerStore } from '@/store/playerStore';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useSWR from 'swr';
import { useEffect, useRef } from 'react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function LyricsPanel() {
  const { isLyricsOpen, toggleLyrics, currentTrack } = usePlayerStore();
  
  const lyricsUrl = isLyricsOpen && currentTrack
    ? `/api/lyrics?track=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist || currentTrack.channelTitle || '')}${currentTrack.saavnId ? `&saavnId=${encodeURIComponent(currentTrack.saavnId)}` : ''}${currentTrack.source ? `&source=${currentTrack.source}` : ''}`
    : null;

  const { data, isLoading, error } = useSWR(lyricsUrl, fetcher);

  if (!isLyricsOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-[calc(100vh-100px)] w-full max-w-md z-40 p-4 md:p-6 animate-fade-in pointer-events-none">
      <div className="clay-panel h-full w-full flex flex-col overflow-hidden pointer-events-auto shadow-2xl bg-surface/95 backdrop-blur-xl border-l-0">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
          <h2 className="text-xl font-bold text-foreground">Lyrics</h2>
          <Button variant="ghost" size="icon" onClick={toggleLyrics} className="h-8 w-8 rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar relative">
          {!currentTrack ? (
            <div className="h-full flex items-center justify-center text-muted-foreground font-semibold">
              No track playing
            </div>
          ) : isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <div className="h-8 w-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground font-bold animate-pulse">Finding lyrics...</p>
            </div>
          ) : error || !data || (!data.plainLyrics && !data.syncedLyrics) ? (
            <div className="h-full flex items-center justify-center text-muted-foreground font-semibold text-center">
              Looks like we don't have lyrics for this track yet.
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-2xl font-bold leading-relaxed text-foreground/80">
              {data.plainLyrics || "Synced lyrics coming soon..."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
