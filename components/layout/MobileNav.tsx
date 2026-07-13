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
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50">
      <div className="h-16 flex items-center justify-around px-2 rounded-2xl bg-surface/80 backdrop-blur-xl border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.6)]">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-16 h-full group"
            >
              {/* Active Top Indicator */}
              {isActive && (
                <div className="absolute top-0 w-8 h-1 bg-brand-primary rounded-b-full shadow-[0_0_10px_rgba(29,185,84,0.6)]" />
              )}
              
              {/* Animated Icon */}
              <div className={cn("absolute transition-all duration-300 flex flex-col items-center", isActive ? "-translate-y-2.5" : "translate-y-0")}>
                <item.icon 
                  className={cn("h-6 w-6 transition-colors duration-300", isActive ? "text-brand-primary" : "text-muted-foreground group-hover:text-foreground")} 
                  strokeWidth={isActive ? 2.5 : 2}
                  fill={isActive ? "currentColor" : "none"}
                />
              </div>

              {/* Animated Text */}
              <span 
                className={cn(
                  "absolute bottom-2 text-[10px] font-bold text-brand-primary transition-all duration-300", 
                  isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
        
        {user?.role === 'admin' && (
          <Link
            href="/admin"
            className="relative flex flex-col items-center justify-center w-16 h-full group"
          >
            {pathname.startsWith('/admin') && (
              <div className="absolute top-0 w-8 h-1 bg-brand-primary rounded-b-full shadow-[0_0_10px_rgba(29,185,84,0.6)]" />
            )}
            <div className={cn("absolute transition-all duration-300 flex flex-col items-center", pathname.startsWith('/admin') ? "-translate-y-2.5" : "translate-y-0")}>
              <ShieldAlert 
                className={cn("h-6 w-6 transition-colors duration-300", pathname.startsWith('/admin') ? "text-brand-primary" : "text-muted-foreground group-hover:text-foreground")} 
                strokeWidth={pathname.startsWith('/admin') ? 2.5 : 2}
              />
            </div>
            <span 
              className={cn(
                "absolute bottom-2 text-[10px] font-bold text-brand-primary transition-all duration-300", 
                pathname.startsWith('/admin') ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              Admin
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
}
