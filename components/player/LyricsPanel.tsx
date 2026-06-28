'use client';

import { useEffect, useState, useRef } from 'react';
import useSWR from 'swr';
import { usePlayerStore } from '@/store/playerStore';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { Loader2, Mic2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface LyricsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LrcLine {
  time: number;
  text: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

function parseLrc(lrcText: string): LrcLine[] {
  const lines = lrcText.split('\n');
  const lrcLines: LrcLine[] = [];
  const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  for (const line of lines) {
    const match = line.match(timeReg);
    if (match) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const ms = parseInt(match[3], 10) * (match[3].length === 2 ? 10 : 1);
      const time = min * 60 + sec + ms / 1000;
      const text = line.replace(timeReg, '').trim();
      
      lrcLines.push({ time, text });
    }
  }

  return lrcLines.sort((a, b) => a.time - b.time);
}

export function LyricsPanel({ isOpen, onClose }: LyricsPanelProps) {
  const { currentTrack } = useYouTubePlayer();
  const { currentTime } = usePlayerStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [lyrics, setLyrics] = useState<LrcLine[]>([]);
  const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);

  // Clean title for better lyrics matching (remove (Official Video), [MV], etc)
  const cleanTitle = currentTrack?.title
    ?.replace(/\([^)]*\)/g, '')
    ?.replace(/\[[^\]]*\]/g, '')
    ?.trim() || '';

  const cleanArtist = currentTrack?.artist?.replace(' - Topic', '').trim() || '';

  const { data, error, isLoading } = useSWR(
    isOpen && cleanTitle ? `/api/lyrics?track=${encodeURIComponent(cleanTitle)}&artist=${encodeURIComponent(cleanArtist)}` : null,
    fetcher
  );

  useEffect(() => {
    if (data?.syncedLyrics) {
      setLyrics(parseLrc(data.syncedLyrics));
    } else if (data?.plainLyrics) {
      // Fallback to plain lyrics, just mock the time to 0
      setLyrics(data.plainLyrics.split('\n').map((text: string) => ({ time: 0, text })));
    } else {
      setLyrics([]);
    }
  }, [data]);

  // Sync lyrics to currentTime
  useEffect(() => {
    if (!lyrics.length || (lyrics.length > 0 && lyrics[0].time === 0)) return; // Don't sync plain lyrics

    // Find the current active line
    let currentIndex = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        currentIndex = i;
      } else {
        break;
      }
    }

    if (currentIndex !== activeLineIndex) {
      setActiveLineIndex(currentIndex);
    }
  }, [currentTime, lyrics, activeLineIndex]);

  // Auto scroll
  useEffect(() => {
    if (activeLineIndex >= 0 && scrollRef.current) {
      const activeEl = scrollRef.current.querySelector(`[data-index="${activeLineIndex}"]`) as HTMLElement;
      if (activeEl) {
        scrollRef.current.scrollTo({
          top: activeEl.offsetTop - scrollRef.current.offsetHeight / 2 + activeEl.offsetHeight / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [activeLineIndex, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 bottom-[90px] w-full md:w-[400px] bg-background/95 backdrop-blur-md border-l border-border z-40 flex flex-col animate-slide-in-right shadow-2xl">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Mic2 className="h-5 w-5 text-brand-primary" />
          <h2 className="font-bold">Lyrics</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide relative" ref={scrollRef}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error || (data && !data.syncedLyrics && !data.plainLyrics) ? (
          <div className="absolute inset-0 flex items-center justify-center text-center px-6">
            <p className="text-muted-foreground">We couldn't find lyrics for this track.</p>
          </div>
        ) : null}

        {lyrics.length > 0 && (
          <div className="flex flex-col gap-6 py-20 min-h-max">
            {lyrics.map((line, idx) => (
              <p
                key={idx}
                data-index={idx}
                className={cn(
                  "text-2xl md:text-3xl font-bold transition-all duration-300",
                  idx === activeLineIndex 
                    ? "text-foreground transform scale-105 origin-left" 
                    : lyrics[0].time === 0 // If plain lyrics
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground/80 cursor-pointer"
                )}
                onClick={() => {
                  // Optional: Implement click to seek if synced
                  if (lyrics[0].time > 0) {
                     // Need to expose seek function from player, not available directly here unless we use postMessage to iframe
                     // Leaving as visual only for now
                  }
                }}
              >
                {line.text || "♪"}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
