'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, ShieldAlert, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import useSWR from 'swr';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Placeholder modal so it doesn't break
const CreatePlaylistModal = ({ isOpen, onClose }: any) => null;

const NAV_ITEMS = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Heart, label: 'Liked Songs', href: '/collection/tracks' },
];

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function Sidebar() {
  const pathname = usePathname();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data: playlists } = useSWR('/api/playlists', fetcher);
  const { user } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-[200px] h-[calc(100vh-2rem)] my-4 ml-4 z-20 shrink-0">
      <div className="clay-panel flex flex-col h-full overflow-hidden">
        
        {/* Brand */}
        <div className="p-6 pb-2">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl clay-btn flex items-center justify-center bg-brand-primary text-white shadow-brand">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">SpotTunes</span>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex flex-col flex-1 px-4 mt-6 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300",
                  isActive 
                    ? "clay-inset text-brand-primary" 
                    : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-brand-primary" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}
          
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 mt-2",
                pathname.startsWith('/admin')
                  ? "clay-inset text-brand-primary" 
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              )}
            >
              <ShieldAlert className={cn("h-5 w-5", pathname.startsWith('/admin') ? "text-brand-primary" : "text-muted-foreground")} />
              Admin
            </Link>
          )}
        </nav>

        {/* Playlists */}
        <div className="px-4 mt-6 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Playlists</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto hide-scrollbar space-y-1 pb-4">
            {Array.isArray(playlists) && playlists.map((pl: any) => (
              <Link
                key={pl._id}
                href={`/playlist/${pl._id}`}
                className={cn(
                  "block px-3 py-2 rounded-lg text-xs font-medium transition-colors truncate",
                  pathname === `/playlist/${pl._id}`
                    ? "clay-inset text-brand-primary"
                    : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                )}
              >
                {pl.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      {/* 
      <CreatePlaylistModal  
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
      */}
    </aside>
  );
}
