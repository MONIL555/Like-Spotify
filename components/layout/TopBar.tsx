'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SearchBar } from '@/components/search/SearchBar';
import React, { Suspense } from 'react';

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-12 items-center justify-between px-3 bg-black/20 backdrop-blur-3xl border-b border-white/5 transition-all duration-300">
      {/* Navigation History */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full h-8 w-8 bg-black/40 hover:bg-black/60 border border-white/5 hidden sm:flex transition-all duration-300 text-white/80 hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="sr-only">Go back</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.forward()}
          className="rounded-full h-8 w-8 bg-black/40 hover:bg-black/60 border border-white/5 hidden sm:flex transition-all duration-300 text-white/80 hover:text-white"
        >
          <ChevronRight className="h-5 w-5" />
          <span className="sr-only">Go forward</span>
        </Button>
      </div>

      {/* Center: Search Bar (only visible on /search routes) */}
      <div className="flex-1 flex justify-center max-w-2xl px-3">
        {pathname.startsWith('/search') && (
          <React.Suspense fallback={<div className="h-12 w-full max-w-sm rounded-full bg-white/5 border border-white/10 animate-pulse" />}>
            <SearchBar />
          </React.Suspense>
        )}
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        {!isAuthenticated ? (
          <>
            <Button variant="ghost" className="hidden sm:flex text-white/70 hover:text-white hover:bg-white/10 rounded-full px-6">
              <Link href="/register">Sign up</Link>
            </Button>
            <Button className="rounded-full px-8 bg-white text-black hover:bg-white/90 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all">
              <Link href="/login">Log in</Link>
            </Button>
          </>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 border border-white/10 hover:border-white/30 transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatarUrl || ''} alt={user?.displayName || ''} />
                  <AvatarFallback style={{ backgroundColor: user?.avatarColor || '#3B82F6', color: 'white' }}>
                    {user?.displayName?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 glass-panel border-white/10 shadow-glass text-white bg-black/60" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-white">{user?.displayName}</p>
                  <p className="text-xs leading-none text-white/60">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="focus:bg-white/10 focus:text-white">
                <Link href="/profile" className="cursor-pointer flex items-center w-full">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-white/10 focus:text-white">
                <Link href="/settings" className="cursor-pointer flex items-center w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-400 focus:bg-red-400/10 focus:text-red-300">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
