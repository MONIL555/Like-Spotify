'use client';

import { Play, MoreHorizontal, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface PlaylistHeaderProps {
  type: 'Playlist' | 'Album' | 'Artist';
  title: string;
  subtitle: string;
  description?: string;
  imageUrl?: string;
  color?: string;
  stats?: React.ReactNode;
  onPlay?: () => void;
  onShuffle?: () => void;
  actions?: React.ReactNode;
}

export function PlaylistHeader({
  type,
  title,
  subtitle,
  description,
  imageUrl,
  color = '#450af5',
  stats,
  onPlay,
  onShuffle,
  actions,
}: PlaylistHeaderProps) {
  return (
    <div className="flex flex-col animate-fade-in relative">
      {/* Background Gradient */}
      <div 
        className="absolute inset-0 h-full w-full pointer-events-none opacity-40 mix-blend-screen"
        style={{ background: `linear-gradient(to bottom, ${color} 0%, transparent 100%)` }}
      />
      
      {/* Header Section */}
      <div className="relative flex flex-col md:flex-row items-end gap-6 p-6 md:p-8 pt-16 md:pt-24 z-10">
        <div className={cn(
          "shadow-2xl flex-shrink-0 bg-muted flex items-center justify-center relative overflow-hidden",
          type === 'Artist' ? 'w-48 h-48 md:w-60 md:h-60 rounded-full' : 'w-48 h-48 md:w-60 md:h-60 rounded-sm'
        )}>
          {imageUrl ? (
            <Image src={imageUrl} alt={title} fill className="object-cover" sizes="240px" />
          ) : (
            <div className="w-full h-full bg-surface-hover flex items-center justify-center">
              <span className="text-4xl text-muted-foreground">{title.charAt(0)}</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2 w-full mt-4 md:mt-0">
          <span className="text-sm font-bold uppercase tracking-wider hidden md:block">{type}</span>
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold tracking-tighter text-foreground mb-2 line-clamp-2">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground text-sm max-w-2xl">{description}</p>
          )}
          <div className="flex items-center gap-2 text-sm font-semibold mt-2">
            <span>{subtitle}</span>
            {stats && (
              <>
                <span className="w-1 h-1 bg-foreground rounded-full hidden sm:block" />
                <span className="text-muted-foreground">{stats}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="relative z-10 px-6 md:px-8 py-4 flex items-center gap-6 bg-background/20 backdrop-blur-sm border-b border-border/10">
        {onPlay && (
          <Button 
            size="icon" 
            onClick={onPlay}
            className="bg-brand-primary text-white rounded-full h-14 w-14 shadow-lg hover:scale-105 hover:bg-brand-hover"
          >
            <Play className="h-6 w-6 fill-current ml-1" />
          </Button>
        )}
        
        {onShuffle && (
          <Button variant="ghost" size="icon" onClick={onShuffle} className="text-muted-foreground hover:text-foreground">
            <Shuffle className="h-8 w-8" />
          </Button>
        )}

        {actions}
      </div>
    </div>
  );
}
