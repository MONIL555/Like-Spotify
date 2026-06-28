import { Metadata } from 'next';
import { GenreCard } from '@/components/music/GenreCard';

export const metadata: Metadata = {
  title: 'Search',
};

const BROWSE_ALL = [
  { id: '1', title: 'Pop', color: '#8d67ab' },
  { id: '2', title: 'Hip-Hop', color: '#ba5d07' },
  { id: '3', title: 'Rock', color: '#e1118c' },
  { id: '4', title: 'Electronic', color: '#509bf5' },
  { id: '5', title: 'R&B', color: '#b02897' },
  { id: '6', title: 'Jazz', color: '#1e3264' },
  { id: '7', title: 'Classical', color: '#7d4b32' },
  { id: '8', title: 'K-Pop', color: '#148a08' },
  { id: '9', title: 'Latin', color: '#e13300' },
  { id: '10', title: 'Reggae', color: '#006450' },
  { id: '11', title: 'Country', color: '#d84000' },
  { id: '12', title: 'Metal', color: '#e91429' },
  { id: '13', title: 'Indie', color: '#608108' },
  { id: '14', title: 'Soul', color: '#b02897' },
  { id: '15', title: 'Podcasts', color: '#006450' },
];

export default function SearchPage() {
  return (
    <div className="p-6 md:p-8 flex flex-col gap-8 animate-fade-in">
      <section>
        <h2 className="text-2xl font-bold tracking-tight mb-6">Browse all</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {BROWSE_ALL.map((genre) => (
            <GenreCard
              key={genre.id}
              title={genre.title}
              color={genre.color}
              href={`/genre/${genre.title.toLowerCase()}`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
