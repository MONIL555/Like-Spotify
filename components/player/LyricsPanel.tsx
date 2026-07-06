'use client';

import { useEffect, useState, useRef } from 'react';
import useSWR from 'swr';
import { usePlayerStore } from '@/store/playerStore';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { Loader2, Mic2, X } from 'lucide-react';
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
    <div className="fixed top-0 right-0 bottom-[90px] w-full md:w-[440px] bg-black/80 backdrop-blur-3xl border-l border-white/10 z-[50] flex flex-col animate-slide-in-right shadow-[-20px_0_40px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-xl">
            <Mic2 className="h-5 w-5 text-accent-coral" />
          </div>
          <h2 className="font-bold text-lg text-white">Lyrics</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white/50 hover:text-white rounded-full">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 scrollbar-hide relative" ref={scrollRef}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-accent-coral" />
          </div>
        )}

        {error || (data && !data.syncedLyrics && !data.plainLyrics) ? (
          <div className="absolute inset-0 flex items-center justify-center text-center px-8">
            <p className="text-white/50 font-medium">We couldn't find lyrics for this track.</p>
          </div>
        ) : null}

        {lyrics.length > 0 && (
          <div className="flex flex-col gap-8 py-24 min-h-max">
            {lyrics.map((line, idx) => (
              <p
                key={idx}
                data-index={idx}
                className={cn(
                  "text-3xl md:text-4xl font-extrabold transition-all duration-500 ease-out",
                  idx === activeLineIndex 
                    ? "text-white transform scale-110 origin-left drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]" 
                    : lyrics[0].time === 0 // If plain lyrics
                      ? "text-white"
                      : "text-white/30 hover:text-white/70 cursor-pointer"
                )}
                onClick={() => {
                  // Visual click only
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
