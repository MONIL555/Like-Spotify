'use client';

import useSWR from 'swr';
import { Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueueStore } from '@/store/queueStore';
import Link from 'next/link';
import { getTimeGreeting } from '@/lib/utils';
import { useState, useEffect } from 'react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function HomeDashboard() {
  const [greeting, setGreeting] = useState('');
  const { data, error, isLoading } = useSWR('/api/recommendations', fetcher);
  const { loadPlaylist } = useQueueStore();

  useEffect(() => {
    setGreeting(getTimeGreeting());
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 animate-fade-in">
        <section>
          <div className="h-8 w-48 bg-muted rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 bg-surface-hover/30 rounded-md p-2">
                <div className="h-16 w-16 md:h-20 md:w-20 bg-muted rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="h-8 w-48 bg-muted rounded animate-pulse mb-4" />
          <div className="flex overflow-hidden gap-6 -mx-6 px-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[160px] md:w-[200px] p-4 bg-surface-hover/30 rounded-xl space-y-4">
                <div className="aspect-square w-full bg-muted rounded-md animate-pulse" />
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-3 w-full bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">
        Failed to load recommendations.
      </div>
    );
  }

  const { recentlyPlayed, newReleases, madeForYou } = data;

  const handlePlayTrack = (track: any) => {
    loadPlaylist([track], 0);
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      {/* Based on recent listening */}
      {madeForYou && madeForYou.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold tracking-tight hover:underline cursor-pointer">
              Based on your recent listening
            </h2>
            <span className="text-xs font-bold text-muted-foreground hover:underline cursor-pointer">
              Show all
            </span>
          </div>
          
          <div className="flex overflow-x-auto pb-3 -mx-4 px-4 gap-4 snap-x snap-mandatory scrollbar-hide">
            {madeForYou.map((item: any) => (
              <Link 
                href={`/album/${item.id}`}
                key={`made-${item.id}`}
                className="snap-start flex-shrink-0 w-[140px] md:w-[180px] lg:w-[200px] 2xl:w-[240px] group p-2.5 rounded-xl glass-card cursor-pointer flex flex-col gap-3 hover:shadow-neon"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white/5 shadow-glass">
                  <img src={item.imageUrl} alt={item.title} className="object-cover w-full h-full" />
                  <div className="absolute bottom-2 right-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <Button 
                      size="icon" 
                      className="bg-brand-primary text-white rounded-full h-10 w-10 shadow-lg shadow-black/40 hover:scale-105 hover:bg-brand-hover"
                      onClick={(e) => { e.preventDefault(); handlePlayTrack(item.data); }}
                    >
                      <Play className="h-4 w-4 fill-current ml-1" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold truncate">{item.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
