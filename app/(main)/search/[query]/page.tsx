'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { Loader2 } from 'lucide-react';
import { TrackRow } from '@/components/music/TrackRow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import Image from 'next/image';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SearchResultsPage() {
  const params = useParams();
  const rawQuery = (params.query as string) || '';
  const query = decodeURIComponent(rawQuery);

  const { data, error, isLoading } = useSWR(
    query ? `/api/search?q=${encodeURIComponent(query)}&type=all` : null,
    fetcher
  );

  if (!query) return null;

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 animate-fade-in flex flex-col gap-8 w-full">
        <div className="h-10 w-full max-w-sm bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8">
          <section>
            <div className="h-8 w-32 bg-muted rounded animate-pulse mb-4" />
            <div className="bg-surface-hover/30 rounded-xl p-5 h-[240px] flex flex-col justify-between">
              <div className="h-24 w-24 rounded-full bg-muted animate-pulse mb-4" />
              <div className="space-y-2">
                <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </section>
          <section>
            <div className="h-8 w-32 bg-muted rounded animate-pulse mb-4" />
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-2 opacity-50">
                  <div className="w-10 h-10 bg-muted rounded animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-1/4 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (error || data?.error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] flex-col gap-4 text-muted-foreground">
        <p>Something went wrong searching for "{query}".</p>
        <p className="text-sm">{data?.error || error?.message}</p>
      </div>
    );
  }

  const items = data?.items || [];

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] flex-col gap-4 text-center">
        <h2 className="text-2xl font-bold">No results found for "{query}"</h2>
        <p className="text-muted-foreground">Please make sure your words are spelled correctly or use less or different keywords.</p>
      </div>
    );
  }

  const topResult = items[0];
  const songs = items; // Assuming YouTube search returned mixed or mostly videos

  return (
    <div className="p-2 md:p-6 animate-fade-in">
      {/* Songs List */}
      <section>
        <h2 className="text-xl font-bold tracking-tight mb-3 px-2">Songs</h2>
        <div className="flex flex-col gap-0.5">
          {songs.map((track: any, i: number) => (
            <TrackRow key={track.videoId} track={track} index={i} contextTracks={songs} />
          ))}
        </div>
      </section>
    </div>
  );
}
