'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, Plus, Heart, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import useSWR from 'swr';
import { CreatePlaylistModal } from '@/components/modals/CreatePlaylistModal';

import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/search' },
];

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function Sidebar() {
  const pathname = usePathname();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data: playlists } = useSWR('/api/playlists', fetcher);
  const { user } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-[200px] lg:w-[240px] glass-panel-heavy border-r-0 border-r border-black/5 h-screen z-20 relative">
      {/* Brand */}
      <div className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-brand-primary"
          >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <span className="font-bold text-lg tracking-tight">SpotTunes</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-col flex-1">
        <div className="px-2 space-y-1 mb-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300",
                  isActive 
                    ? "bg-black/5 shadow-sm border border-black/5 text-foreground font-semibold" 
                    : "text-muted-foreground hover:text-foreground hover:bg-black/5 font-medium"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300",
                pathname.startsWith('/admin')
                  ? "bg-black/5 shadow-sm border border-black/5 text-foreground font-semibold" 
                  : "text-muted-foreground hover:text-foreground hover:bg-black/5 font-medium"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 lucide lucide-shield-alert"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-3 5-3 1.1 0 2 1.5 5 3a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
              Admin
            </Link>
          )}
        </div>
      </nav>

      <CreatePlaylistModal  
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </aside>
  );
}
