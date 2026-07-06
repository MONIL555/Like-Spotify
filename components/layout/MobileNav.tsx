'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/search' },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/60 backdrop-blur-xl border-t border-white/10 z-50">
      <div className="flex items-center justify-around h-full px-2 pb-safe">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-16 h-full transition-all duration-300",
                isActive ? "text-accent-coral scale-110" : "text-white/50 hover:text-white"
              )}
            >
              <item.icon className={cn("h-6 w-6 transition-colors", isActive && "fill-current")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        {user?.role === 'admin' && (
          <Link
            href="/admin"
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-16 h-full transition-all duration-300",
              pathname.startsWith('/admin') ? "text-accent-coral scale-110" : "text-white/50 hover:text-white"
            )}
          >
            <ShieldAlert className={cn("h-6 w-6 transition-colors", pathname.startsWith('/admin') && "fill-current")} />
            <span className="text-[10px] font-medium">Admin</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
