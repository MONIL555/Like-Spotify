import Link from 'next/link';

interface GenreCardProps {
  title: string;
  color: string;
  imageUrl?: string;
  href: string;
}

export function GenreCard({ title, color, imageUrl, href }: GenreCardProps) {
  return (
    <Link 
      href={href}
      className="relative overflow-hidden rounded-xl aspect-square p-4 shadow-card hover:scale-[1.02] transition-transform duration-200 cursor-pointer block group"
      style={{ backgroundColor: color }}
    >
      <h3 className="text-xl md:text-2xl font-bold text-white z-10 relative">
        {title}
      </h3>
      
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent z-0" />
      
      {/* Decorative angled shape simulating album cover protruding */}
      {imageUrl ? (
        <div 
          className="absolute -bottom-2 -right-4 w-24 h-24 md:w-32 md:h-32 rotate-[25deg] shadow-2xl transition-transform duration-300 group-hover:rotate-[20deg] group-hover:scale-105"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ) : (
        <div className="absolute -bottom-2 -right-4 w-24 h-24 md:w-32 md:h-32 rotate-[25deg] shadow-2xl bg-black/10 backdrop-blur-sm transition-transform duration-300 group-hover:rotate-[20deg] group-hover:scale-105" />
      )}
    </Link>
  );
}
