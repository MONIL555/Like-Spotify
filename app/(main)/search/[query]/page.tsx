'use client';

import useSWR from 'swr';
import { TrackRow } from '@/components/music/TrackRow';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SearchResultPage() {
  const params = useParams();
  const query = params.query ? decodeURIComponent(params.query as string) : '';
  
  const { data, error, isLoading } = useSWR(query ? `/api/search?q=${encodeURIComponent(query)}` : null, fetcher);

  return (
    <div className="py-6 flex flex-col gap-8 animate-fade-in">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-6">
          Top Results for "{query}"
        </h2>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-brand-primary">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        ) : error ? (
          <div className="clay-card p-12 text-center">
            <h3 className="text-xl font-bold text-destructive">Error loading results.</h3>
          </div>
        ) : !data || !data.items || data.items.length === 0 ? (
          <div className="clay-card p-12 text-center">
            <h3 className="text-xl font-bold text-muted-foreground">No results found for "{query}"</h3>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {data.items.map((track: any, i: number) => (
              <TrackRow 
                key={track.videoId} 
                track={track} 
                index={i}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
