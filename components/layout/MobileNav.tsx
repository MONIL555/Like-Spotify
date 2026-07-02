'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/search' },
];

export function MobileNav() {
  const pathname = usePathname();
  const { currentTrack } = useYouTubePlayer();
  const { user } = useAuth();
  
  return (
    <nav className={cn(
      "md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/60 backdrop-blur-3xl border-t border-black/5 z-50 transition-all duration-300",
      ""
    )}>
      <div className="flex items-center justify-around h-14 px-2 pb-safe">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "fill-current")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        {user?.role === 'admin' && (
          <Link
            href="/admin"
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors",
              pathname.startsWith('/admin') ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShieldAlert className={cn("h-5 w-5", pathname.startsWith('/admin') && "fill-current")} />
            <span className="text-[10px] font-medium">Admin</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
