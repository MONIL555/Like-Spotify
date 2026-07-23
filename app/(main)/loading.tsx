export default function MainLoading() {
  return (
    <div className="py-6 animate-fade-in">
      <div className="flex flex-col gap-8 pb-12">
        {/* Mood pills skeleton */}
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-24 rounded-full bg-white/5 animate-pulse shrink-0" />
          ))}
        </div>

        {/* Hero banner skeleton */}
        <div className="h-48 md:h-72 rounded-[32px] bg-white/5 animate-pulse" />

        {/* Section skeleton */}
        <div>
          <div className="h-7 w-48 bg-white/5 rounded animate-pulse mb-4" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[140px] md:w-[180px] shrink-0">
                <div className="aspect-square rounded-[24px] bg-white/5 animate-pulse mb-3" />
                <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse mb-2" />
                <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
