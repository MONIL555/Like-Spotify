'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, Plus, Heart, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import useSWR from 'swr';
import { CreatePlaylistModal } from '@/components/modals/CreatePlaylistModal';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/search' },
];

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function Sidebar() {
  const pathname = usePathname();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data: playlists } = useSWR('/api/playlists', fetcher);

  return (
    <aside className="hidden md:flex flex-col w-[240px] lg:w-[280px] bg-sidebar border-r border-border h-[calc(100vh-90px)]">
      {/* Brand */}
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-brand-primary"
          >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <span className="font-bold text-xl tracking-tight">SoundWave</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-col flex-1">
        <div className="px-3 space-y-1 mb-6">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-3 py-3 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-surface-hover text-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-hover/50"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4">
            <Link 
              href="/collection" 
              className="flex items-center gap-4 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <Library className="h-6 w-6 group-hover:text-foreground transition-colors" />
              <span className="font-bold">Your Library</span>
            </Link>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-surface-hover/50 rounded-full"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-surface-hover/50 rounded-full">
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="px-4 py-2">
            <div className="flex gap-2 mb-4 px-2">
              <span className="text-xs font-semibold px-3 py-1 bg-surface-hover rounded-full">Playlists</span>
              <span className="text-xs font-semibold px-3 py-1 bg-surface-hover rounded-full">Albums</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
            {/* Liked Songs Fixed Item */}
            <Link 
              href="/collection/tracks"
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-md hover:bg-surface-hover transition-colors group",
                pathname === '/collection/tracks' && "bg-surface-hover/50"
              )}
            >
              <div className="w-12 h-12 rounded bg-gradient-to-br from-indigo-500 to-purple-400 flex items-center justify-center shadow-md flex-shrink-0">
                <Heart className="h-5 w-5 text-white fill-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium truncate text-base",
                  pathname === '/collection/tracks' ? "text-brand-primary" : "text-foreground group-hover:text-foreground"
                )}>
                  Liked Songs
                </p>
                <p className="text-sm text-muted-foreground truncate">Playlist • {playlists?.length ? 'You' : '0 songs'}</p>
              </div>
            </Link>

            {/* User Playlists */}
            {playlists && Array.isArray(playlists) && playlists.map((playlist: any) => (
              <Link 
                key={playlist._id}
                href={`/playlist/${playlist._id}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-md hover:bg-surface-hover transition-colors group",
                  pathname === `/playlist/${playlist._id}` && "bg-surface-hover/50"
                )}
              >
                <div className="w-12 h-12 rounded bg-surface flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden relative">
                  {playlist.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={playlist.coverImageUrl} alt={playlist.name} className="w-full h-full object-cover" />
                  ) : (
                    <Library className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium truncate text-base",
                    pathname === `/playlist/${playlist._id}` ? "text-brand-primary" : "text-foreground group-hover:text-foreground"
                  )}>
                    {playlist.name}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    Playlist • You
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <CreatePlaylistModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </aside>
  );
}
