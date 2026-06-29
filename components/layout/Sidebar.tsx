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
        </div>
      </nav>

      <CreatePlaylistModal  
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </aside>
  );
}
