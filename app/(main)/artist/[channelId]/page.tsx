'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { Loader2 } from 'lucide-react';
import { PlaylistHeader } from '@/components/music/PlaylistHeader';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ArtistPage() {
  const params = useParams();
  const channelId = params.channelId as string;
  
  const { data, error, isLoading } = useSWR(channelId ? `/api/artists/${channelId}` : null, fetcher);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full pb-8 w-full">
        <div className="flex flex-col md:flex-row items-end gap-6 p-6 md:p-8 bg-gradient-to-b from-surface to-background animate-pulse h-64 md:h-80">
          <div className="flex flex-col gap-4 w-full mt-auto">
            <div className="h-4 w-24 bg-muted rounded hidden md:block" />
            <div className="h-16 w-1/2 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
        </div>
        <div className="px-6 md:px-8 mt-6 w-full">
          <div className="h-8 w-48 bg-muted rounded animate-pulse mb-6" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-2 opacity-50">
                <div className="w-10 h-10 bg-muted rounded animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data || !data.artist) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] flex-col gap-4 text-muted-foreground">
        <p>Artist not found.</p>
      </div>
    );
  }

  const { artist, albums } = data;
  
  // Format followers count
  const followerCount = new Intl.NumberFormat('en-US', { 
    notation: "compact", 
    compactDisplay: "short" 
  }).format(artist.followers);

  return (
    <div className="flex flex-col min-h-full pb-8">
      <PlaylistHeader
        type="Artist"
        title={artist.name}
        subtitle="Artist"
        description={artist.description}
        imageUrl={artist.thumbnailUrl}
        color="#38bdf8" // brand-primary ish
        stats={`${followerCount} followers`}
      />

      {/* Albums / Popular Playlists Grid */}
      <div className="px-6 md:px-8 mt-10">
        <h2 className="text-2xl font-bold mb-6">Discography</h2>
        
        {albums && albums.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {albums.map((album: any) => (
              <Link 
                key={album.id}
                href={`/album/${album.id}`}
                className="group p-4 rounded-xl bg-surface hover:bg-surface-hover transition-colors shadow-sm flex flex-col gap-4"
              >
                <div className="relative aspect-square w-full rounded-md overflow-hidden bg-muted shadow-md">
                  {album.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={album.thumbnailUrl} 
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface">
                      <span className="text-muted-foreground">No image</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="font-bold text-foreground truncate">{album.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {new Date(album.publishedAt).getFullYear()} • {album.trackCount} tracks
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No albums found.</p>
        )}
      </div>
    </div>
  );
}
