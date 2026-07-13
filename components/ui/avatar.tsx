import * as React from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: React.ReactNode;
  fallbackColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Avatar({ src, alt, fallback, fallbackColor = "var(--brand-primary)", size = 'md', className, ...props }: AvatarProps) {
  const [error, setError] = React.useState(false);
  
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-lg",
    xl: "h-24 w-24 text-2xl"
  };

  return (
    <div 
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full clay-btn",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && !error ? (
        <Image
          src={src}
          alt={alt || "Avatar"}
          fill
          sizes="96px"
          className="object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <div 
          className="flex h-full w-full items-center justify-center font-bold text-white"
          style={{ backgroundColor: fallbackColor }}
        >
          {fallback || alt?.charAt(0)?.toUpperCase() || "?"}
        </div>
      )}
    </div>
  )
}
