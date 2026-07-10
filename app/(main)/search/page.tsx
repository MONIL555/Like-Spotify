'use client';

import { useState, useEffect } from 'react';
import { useHistoryStore } from '@/store/historyStore';
import { TrackRow } from '@/components/music/TrackRow';
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SearchPage() {
  const { recentlyPlayed, removeFromHistory } = useHistoryStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRemoveFromHistory = (videoId: string) => {
    removeFromHistory(videoId);
  };

  return (
    <div className="py-6 flex flex-col gap-8 animate-fade-in">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-6">Recently Played</h2>
        
        {!mounted ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 opacity-50">
                <div className="w-12 h-12 bg-surface rounded-lg animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-1/3 bg-surface rounded animate-pulse" />
                  <div className="h-4 w-1/4 bg-surface rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : recentlyPlayed.length === 0 ? (
          <div className="clay-card p-12 text-center">
            <h3 className="text-xl font-bold text-muted-foreground">Listen to some tracks to see history here!</h3>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentlyPlayed.map((track: any, i: number) => (
              <TrackRow 
                key={`history-${track.videoId}-${i}`} 
                track={track} 
                index={i} 
                onRemove={() => handleRemoveFromHistory(track.videoId)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
