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
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between px-6 bg-background/80 backdrop-blur-md border-b border-border/40">
      {/* Navigation History */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full h-8 w-8 bg-surface-hover hover:bg-surface-hover/80 hidden sm:flex"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="sr-only">Go back</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.forward()}
          className="rounded-full h-8 w-8 bg-surface-hover hover:bg-surface-hover/80 hidden sm:flex"
        >
          <ChevronRight className="h-5 w-5" />
          <span className="sr-only">Go forward</span>
        </Button>
      </div>

      {/* Center: Search Bar (only visible on /search routes) */}
      <div className="flex-1 flex justify-center max-w-2xl px-4">
        {pathname.startsWith('/search') && (
          <React.Suspense fallback={<div className="h-12 w-full max-w-sm rounded-full bg-surface-hover/50 animate-pulse" />}>
            <SearchBar />
          </React.Suspense>
        )}
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        {!isAuthenticated ? (
          <>
            <Button variant="ghost" className="hidden sm:flex text-muted-foreground hover:text-foreground">
              <Link href="/register">Sign up</Link>
            </Button>
            <Button className="rounded-full px-8 bg-foreground text-background hover:bg-foreground/90">
              <Link href="/login">Log in</Link>
            </Button>
          </>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={user?.avatarUrl || ''} alt={user?.displayName || ''} />
                  <AvatarFallback style={{ backgroundColor: user?.avatarColor }}>
                    {user?.displayName?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/profile" className="cursor-pointer flex items-center w-full">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/settings" className="cursor-pointer flex items-center w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
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
