import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Your Library',
};

export default function CollectionPage() {
  return (
    <div className="p-6 md:p-8 animate-fade-in flex flex-col gap-8">
      <div className="flex items-center gap-4 text-sm font-semibold mb-2">
        <Link href="/collection" className="bg-surface px-4 py-2 rounded-full text-foreground hover:bg-surface-hover transition-colors">
          Playlists
        </Link>
        <Link href="/collection/podcasts" className="bg-transparent px-4 py-2 rounded-full text-muted-foreground hover:bg-surface-hover/50 transition-colors">
          Podcasts
        </Link>
        <Link href="/collection/artists" className="bg-transparent px-4 py-2 rounded-full text-muted-foreground hover:bg-surface-hover/50 transition-colors">
          Artists
        </Link>
        <Link href="/collection/albums" className="bg-transparent px-4 py-2 rounded-full text-muted-foreground hover:bg-surface-hover/50 transition-colors">
          Albums
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {/* Liked Songs Special Card */}
        <Link
          href="/collection/tracks"
          className="col-span-2 group relative overflow-hidden rounded-xl p-5 shadow-card hover:scale-[1.02] transition-transform duration-200 cursor-pointer flex flex-col justify-end min-h-[200px]"
          style={{ background: 'linear-gradient(135deg, #450af5, #c4efd9)' }}
        >
          <div className="z-10 mt-auto">
            <h3 className="text-3xl font-bold text-white mb-2">Liked Songs</h3>
            <p className="text-white/80 font-medium">Your favorite tracks</p>
          </div>
          
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-brand-primary text-white rounded-full h-12 w-12 flex items-center justify-center shadow-lg hover:scale-105 hover:bg-brand-hover">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-1">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </Link>
        
        {/* Mock other library items */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i}
            className="group p-4 rounded-xl bg-surface hover:bg-surface-hover transition-colors cursor-pointer flex flex-col gap-4"
          >
            <div className="relative aspect-square w-full rounded-md overflow-hidden bg-muted shadow-card">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold truncate">My Playlist #{i + 1}</h3>
              <p className="text-sm text-muted-foreground line-clamp-1">By You</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
