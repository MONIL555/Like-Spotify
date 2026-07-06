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
    <aside className="hidden md:flex flex-col w-[160px] lg:w-[180px] glass-panel border-r-0 border-r border-white/10 h-screen z-20 relative">
      {/* Brand */}
      <div className="p-3">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-gradient-brand p-2 rounded-xl shadow-neon transition-transform duration-300 group-hover:scale-105">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight text-white">SpotTunes</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-col flex-1 px-3">
        <div className="space-y-1 mb-4">
          <p className="px-3 text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1">Menu</p>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-xl text-sm transition-all duration-300",
                  isActive 
                    ? "bg-white/10 shadow-sm border border-white/10 text-white font-semibold" 
                    : "text-white/60 hover:text-white hover:bg-white/5 font-medium"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-accent-coral" : "text-white/60")} />
                {item.label}
              </Link>
            );
          })}
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-xl text-sm transition-all duration-300",
                pathname.startsWith('/admin')
                  ? "bg-white/10 shadow-sm border border-white/10 text-white font-semibold" 
                  : "text-white/60 hover:text-white hover:bg-white/5 font-medium"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white/60"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-3 5-3 1.1 0 2 1.5 5 3a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
              Admin
            </Link>
          )}
        </div>
      </nav>

      {/* User profile section would go here or in TopBar */}
      
      <CreatePlaylistModal  
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </aside>
  );
}
