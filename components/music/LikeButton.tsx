'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface LikeButtonProps {
  videoId: string;
  initialLiked?: boolean;
  className?: string;
}

export function LikeButton({ videoId, initialLiked = false, className }: LikeButtonProps) {
  const { isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isLoading, setIsLoading] = useState(false);

  // In a real app, you would fetch the initial state via SWR based on user's liked tracks
  // and sync the toggle with the backend.

  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return; // Or show login modal

    // Optimistic update
    setIsLiked(!isLiked);
    setIsLoading(true);

    try {
      const res = await fetch('/api/library/liked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to toggle like');
      }
      
      const data = await res.json();
      setIsLiked(data.liked);
    } catch (error) {
      console.error(error);
      // Revert optimistic update on failure
      setIsLiked(isLiked);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLike}
      disabled={isLoading || !isAuthenticated}
      className={cn(
        "text-muted-foreground hover:text-foreground transition-colors",
        isLiked && "text-brand-primary hover:text-brand-hover",
        className
      )}
    >
      <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
      <span className="sr-only">{isLiked ? 'Unlike' : 'Like'}</span>
    </Button>
  );
}
