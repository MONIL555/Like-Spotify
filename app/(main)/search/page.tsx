'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { TrackRow } from '@/components/music/TrackRow';
import { Clock, Search as SearchIcon, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SearchPage() {
  const router = useRouter();
  const { data, error, isLoading } = useSWR('/api/recommendations', fetcher);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const removeSearch = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter(q => q !== query);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSearchClick = (query: string) => {
    router.push(`/search/${encodeURIComponent(query)}`);
  };

  return (
    <div className="p-2 md:p-4 flex flex-col gap-2 animate-fade-in">
      <section>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-2 opacity-50">
                <div className="w-10 h-10 bg-muted rounded animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-1/4 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : error || !data || !data.recentlyPlayed || data.recentlyPlayed.length === 0 ? (
          <div className="text-muted-foreground px-2 text-sm">
            Listen to some tracks to see recommendations here!
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {data.recentlyPlayed.map((item: any, i: number) => (
              <TrackRow key={`history-${item.id}-${i}`} track={item.data} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
