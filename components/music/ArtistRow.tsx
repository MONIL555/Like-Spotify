'use client';

import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User, ChevronRight } from 'lucide-react';

import { memo } from 'react';

interface ArtistRowProps {
  artist: any;
  index?: number;
}

export const ArtistRow = memo(function ArtistRow({ artist, index }: ArtistRowProps) {
  const router = useRouter();
  
  const title = artist.title || artist.channelName || 'Unknown Artist';
  const thumbnail = artist.thumbnail || (artist.thumbnails?.default as string) || (artist.thumbnails?.high as string) || '';

  const handleClick = () => {
    router.push(`/artist/${encodeURIComponent(title)}`);
  };

  return (
    <div className="relative w-full rounded-xl mb-1 group">
      <div 
        className={cn(
          "relative bg-background flex items-center gap-3 md:gap-4 px-3 md:px-4 py-2 md:py-3 rounded-xl cursor-pointer transition-all duration-200",
          "hover:bg-surface-hover hover:scale-[1.01] hover:shadow-md"
        )}
        onClick={handleClick}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <Avatar 
            size="lg" 
            src={thumbnail} 
            alt={title}
            className="rounded-full h-12 w-12 md:h-16 md:w-16 border-2 border-transparent group-hover:border-brand-primary transition-colors" 
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="font-bold truncate text-sm md:text-base text-foreground group-hover:text-brand-primary transition-colors">
            {title}
          </div>
          <div className="flex items-center gap-1 text-[11px] md:text-xs font-semibold text-muted-foreground mt-0.5">
            <User className="h-3 w-3" />
            <span>Artist</span>
          </div>
        </div>

        {/* Right Arrow */}
        <div className="shrink-0 text-muted-foreground group-hover:text-brand-primary transition-colors mr-2">
          <ChevronRight className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
});
