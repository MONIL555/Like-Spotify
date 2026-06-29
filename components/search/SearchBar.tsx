'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Search as SearchIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SearchBar() {
  const router = useRouter();
  const params = useParams();
  
  const rawQuery = (params.query as string) || '';
  const currentQuery = rawQuery ? decodeURIComponent(rawQuery) : '';
  
  const [query, setQuery] = useState(currentQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount if we're on the search page
  useEffect(() => {
    if (window.location.pathname === '/search' && !currentQuery) {
      inputRef.current?.focus();
    }
  }, [currentQuery]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        router.push(`/search/${encodeURIComponent(query.trim())}`);
        // Save to local storage for "Recent Searches"
        const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        const updated = [query.trim(), ...recent.filter((q: string) => q !== query.trim())].slice(0, 10);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
      } else if (query === '' && currentQuery !== '') {
        router.push('/search');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, router, currentQuery]);

  const clearSearch = () => {
    setQuery('');
    router.push('/search');
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-sm flex items-center group">
      <div className="absolute left-3 text-muted-foreground group-focus-within:text-foreground transition-colors">
        <SearchIcon className="h-5 w-5" />
      </div>
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="What do you want to listen to?"
        className="pl-10 pr-10 rounded-full bg-surface-hover/50 border-transparent hover:border-border hover:bg-surface-hover focus-visible:bg-surface focus-visible:ring-brand-primary h-12 text-base transition-all shadow-sm"
      />
      {query && (
        <Button
          variant="ghost"
          size="icon"
          onClick={clearSearch}
          className="absolute right-2 h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  );
}
