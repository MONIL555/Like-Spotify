import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Music } from 'lucide-react';

interface TrackCoverProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackColor?: string;
  sizes?: string;
  children?: React.ReactNode;
}

export function TrackCover({ src, alt, className, fallbackColor = "var(--brand-primary)", sizes = "160px", children }: TrackCoverProps) {
  const [error, setError] = useState(false);

  return (
    <div className={cn("relative overflow-hidden flex items-center justify-center bg-white/5", className)}>
      {src && !error ? (
        <Image
          src={src}
          alt={alt || "Cover"}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-500 group-hover:scale-110 group-hover:rotate-1"
          onError={() => setError(true)}
        />
      ) : (
        <div 
          className="flex h-full w-full items-center justify-center font-bold text-white text-3xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-1"
          style={{ backgroundColor: fallbackColor }}
        >
          {alt?.charAt(0)?.toUpperCase() || <Music className="w-12 h-12 text-white/50" />}
        </div>
      )}
      {children}
    </div>
  );
}
