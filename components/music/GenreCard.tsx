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
      className="clay-card relative overflow-hidden aspect-square p-6 cursor-pointer block group"
      style={{ backgroundColor: color }}
    >
      <h3 className="text-2xl md:text-3xl font-bold text-white z-10 relative drop-shadow-md">
        {title}
      </h3>
      
      {imageUrl ? (
        <div 
          className="absolute -bottom-4 -right-4 w-28 h-28 md:w-36 md:h-36 rotate-[25deg] shadow-2xl transition-transform duration-300 group-hover:rotate-[20deg] group-hover:scale-110 rounded-xl"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ) : (
        <div className="absolute -bottom-4 -right-4 w-28 h-28 md:w-36 md:h-36 rotate-[25deg] shadow-2xl bg-black/20 backdrop-blur-sm transition-transform duration-300 group-hover:rotate-[20deg] group-hover:scale-110 rounded-xl" />
      )}
    </Link>
  );
}
