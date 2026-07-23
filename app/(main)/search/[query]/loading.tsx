export default function SearchLoading() {
  return (
    <div className="py-4 animate-fade-in">
      {/* Track list skeleton */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl">
            <div className="h-11 w-11 rounded-lg bg-white/5 animate-pulse shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="h-4 w-3/5 bg-white/5 rounded animate-pulse mb-2" />
              <div className="h-3 w-2/5 bg-white/5 rounded animate-pulse" />
            </div>
            <div className="h-4 w-10 bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
