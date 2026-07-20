import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/10 ${className}`}
      {...props}
    />
  );
}

export function TrackSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
      <Skeleton className="h-12 w-12 rounded-md shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <Skeleton className="h-4 w-3/4 max-w-[200px]" />
        <Skeleton className="h-3 w-1/2 max-w-[150px]" />
      </div>
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-3 rounded-xl bg-white/5 h-full">
      <Skeleton className="w-full aspect-square rounded-lg" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}
