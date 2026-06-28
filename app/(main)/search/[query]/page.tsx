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
    <div className="p-6 md:p-8 animate-fade-in">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-8 bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 space-x-6">
          <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-brand-primary rounded-none px-0 pb-3 font-semibold text-base">All</TabsTrigger>
          <TabsTrigger value="songs" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-brand-primary rounded-none px-0 pb-3 font-semibold text-base">Songs</TabsTrigger>
          <TabsTrigger value="artists" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-brand-primary rounded-none px-0 pb-3 font-semibold text-base">Artists</TabsTrigger>
          <TabsTrigger value="albums" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-brand-primary rounded-none px-0 pb-3 font-semibold text-base">Albums</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8">
            {/* Top Result */}
            <section>
              <h2 className="text-2xl font-bold tracking-tight mb-4">Top result</h2>
              <div className="bg-surface hover:bg-surface-hover/80 transition-colors rounded-xl p-5 relative group cursor-pointer h-[240px] flex flex-col justify-between shadow-sm">
                <div className="relative h-24 w-24 rounded-full overflow-hidden mb-4 shadow-md bg-muted">
                  <Image 
                    src={topResult.thumbnail} 
                    alt={topResult.title} 
                    fill 
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div>
                  <h3 className="text-3xl font-bold truncate mb-1">{topResult.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-semibold">{topResult.channelName}</span>
                    <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                    <span className="uppercase tracking-wider font-semibold text-[11px] bg-background px-2 py-1 rounded-full">Song</span>
                  </div>
                </div>
                
                <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  <Button 
                    size="icon" 
                    className="bg-brand-primary text-white rounded-full h-12 w-12 shadow-lg hover:scale-105 hover:bg-brand-hover"
                  >
                    <Play className="h-5 w-5 fill-current ml-1" />
                  </Button>
                </div>
              </div>
            </section>
            
            {/* Songs List */}
            <section>
              <h2 className="text-2xl font-bold tracking-tight mb-4">Songs</h2>
              <div className="flex flex-col">
                {songs.slice(0, 4).map((track: any, i: number) => (
                  <TrackRow key={track.videoId} track={track} />
                ))}
              </div>
            </section>
          </div>
        </TabsContent>
        
        <TabsContent value="songs" className="mt-0 outline-none">
          <div className="flex flex-col gap-1">
            {songs.map((track: any, i: number) => (
              <TrackRow key={track.videoId} track={track} index={i} />
            ))}
          </div>
        </TabsContent>
        
        {/* Placeholder for other tabs */}
        <TabsContent value="artists" className="mt-0 outline-none text-muted-foreground pt-4">
          Artists results would appear here.
        </TabsContent>
        <TabsContent value="albums" className="mt-0 outline-none text-muted-foreground pt-4">
          Albums results would appear here.
        </TabsContent>
      </Tabs>
    </div>
  );
}
