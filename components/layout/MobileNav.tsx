'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShieldAlert, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Heart, label: 'Liked', href: '/collection/tracks' },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="clay-panel h-16 flex items-center justify-around px-2 pb-safe bg-surface/95 backdrop-blur-md shadow-2xl">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-full transition-all duration-300",
                isActive ? "clay-inset text-brand-primary" : "text-muted-foreground hover:text-foreground hover:scale-110"
              )}
            >
              <item.icon className={cn("h-5 w-5 transition-colors", isActive && "fill-brand-primary/20")} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
        {user?.role === 'admin' && (
          <Link
            href="/admin"
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-full transition-all duration-300",
              pathname.startsWith('/admin') ? "clay-inset text-brand-primary" : "text-muted-foreground hover:text-foreground hover:scale-110"
            )}
          >
            <ShieldAlert className={cn("h-5 w-5 transition-colors", pathname.startsWith('/admin') && "fill-brand-primary/20")} />
            <span className="text-[10px] font-bold">Admin</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
