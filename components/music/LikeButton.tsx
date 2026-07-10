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

  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return;

    setIsLiked(!isLiked);
    setIsLoading(true);

    try {
      const res = await fetch('/api/library/liked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      });
      if (!res.ok) throw new Error('Failed to toggle like');
      const data = await res.json();
      setIsLiked(data.liked);
    } catch (error) {
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
        "h-10 w-10 text-muted-foreground hover:text-brand-primary transition-all duration-300",
        isLiked && "text-brand-primary",
        className
      )}
    >
      <Heart className={cn("h-5 w-5 transition-transform", isLiked && "fill-current scale-110")} />
    </Button>
  );
}
