'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Library, label: 'Library', href: '/collection' },
];

export function MobileNav() {
  const pathname = usePathname();
  const { currentTrack } = useYouTubePlayer();
  
  // Calculate bottom padding if player is active
  const bottomPadding = currentTrack ? 'pb-[90px]' : 'pb-0';

  return (
    <nav className={cn(
      "md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-40 transition-transform duration-300",
      bottomPadding
    )}>
      <div className="flex items-center justify-around h-16 px-4 pb-safe">
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
              <item.icon className={cn("h-6 w-6", isActive && "fill-current")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
