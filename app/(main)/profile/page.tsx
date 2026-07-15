'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useHistoryStore } from '@/store/historyStore';
import { Button } from '@/components/ui/button';
import { Settings, Heart, ListMusic, History, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';
import { TrackRow } from '@/components/music/TrackRow';
import useSWR from 'swr';
import { CreatePlaylistModal } from '@/components/layout/CreatePlaylistModal';
import { Plus } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ProfilePage() {
  const [activeView, setActiveView] = useState<'recent' | 'playlists'>('recent');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const recentlyPlayed = useHistoryStore((state) => state.recentlyPlayed);
  const { data: playlists } = useSWR('/api/playlists', fetcher);

  if (!isAuthenticated) return null;

  return (
    <div className="py-2 md:py-6 px-4 md:px-8 flex flex-col gap-8 animate-fade-in pb-32">
      {/* Profile Header (Sleek, Row-based) */}
      <div className="flex items-start justify-between w-full gap-2 md:gap-4">
        
        <div className="flex flex-col justify-center min-w-0 flex-1 py-2">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-1 truncate">{user?.displayName}</h1>
          <p className="text-sm md:text-base font-medium text-muted-foreground mb-4 truncate">{user?.email}</p>
          
          <div className="flex items-center gap-4 text-brand-primary font-bold text-sm md:text-base flex-wrap">
            <div className="flex items-center gap-1.5">
              <Heart className="h-4 w-4 fill-brand-primary shrink-0" />
              <span>{user?.likedTrackIds?.length || 0}</span> 
              <span className="text-muted-foreground font-semibold text-xs md:text-sm uppercase tracking-wider ml-0.5 truncate">Liked Tracks</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-500">
              <ListMusic className="h-4 w-4 shrink-0" />
              <span>{Array.isArray(playlists) ? playlists.length : 0}</span> 
              <span className="text-muted-foreground font-semibold text-xs md:text-sm uppercase tracking-wider ml-0.5 truncate">Playlists</span>
            </div>
          </div>
        </div>

        {/* Settings Button */}
        <Link href="/settings" className="shrink-0 mt-2 md:mt-4">
          <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-foreground">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Content Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold">
              {activeView === 'recent' ? 'Recently Played' : 'Your Playlists'}
            </h2>
            {activeView === 'playlists' && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsCreateModalOpen(true)}
                className="h-8 w-8 rounded-full text-brand-primary hover:bg-brand-primary/20"
              >
                <Plus className="h-5 w-5" />
              </Button>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setActiveView(activeView === 'recent' ? 'playlists' : 'recent')}
            className="text-muted-foreground hover:text-foreground h-8 w-8"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        </div>

        {activeView === 'recent' ? (
          recentlyPlayed.length > 0 ? (
            <div className="flex flex-col">
              {recentlyPlayed.slice(0, 10).map((track, index) => (
                <TrackRow 
                  key={`${track.videoId}-${index}`} 
                  track={track} 
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground rounded-xl border-dashed border-2 border-border/50">
              <p className="font-semibold text-sm mb-1">No recent activity</p>
              <p className="text-xs">Songs you play will appear here.</p>
            </div>
          )
        ) : (
          Array.isArray(playlists) && playlists.length > 0 ? (
            <div className="flex flex-col gap-2">
              {playlists.map((pl: any) => (
                <Link 
                  key={pl._id} 
                  href={`/playlist/${pl._id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-hover transition-colors"
                >
                  <div className="h-12 w-12 rounded-md bg-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0">
                    <ListMusic className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{pl.name}</p>
                    <p className="text-xs text-muted-foreground">Playlist</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground rounded-xl border-dashed border-2 border-border/50">
              <p className="font-semibold text-sm mb-1">No playlists yet</p>
              <p className="text-xs">Create one from the sidebar to get started.</p>
            </div>
          )
        )}
      </div>
      <CreatePlaylistModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}
