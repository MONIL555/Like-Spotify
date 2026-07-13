'use client';

import useSWR from 'swr';
import { Play, Plus, Heart, Shuffle, ChevronRight, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueueStore } from '@/store/queueStore';
import { usePlayerStore } from '@/store/playerStore';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { useCallback } from 'react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Cache configuration: 5 hours (deduping interval)
const FIVE_HOURS = 5 * 60 * 60 * 1000;
const SWR_OPTIONS = { dedupingInterval: FIVE_HOURS, focusThrottleInterval: FIVE_HOURS };

const MOODS = ['Romance', 'Party', '90s Hits', 'Workout', 'Ghazal', 'Chill', 'Sufi', 'Indie'];

const HERO_ARTISTS = [
  {
    name: "Yo Yo Honey Singh",
    subtitle: "The pioneer of Indian Pop & Rap.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQC_jJBJXA9iaswCSjjhgRsYRRoezhq3zaO769BUGJ7g&s=10",
    query: "Yo Yo Honey Singh Hits",
    style: { objectPosition: "center 6%" }
  },
  {
    name: "Arijit Singh",
    subtitle: "The voice of modern Bollywood romance.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0IamAfa5vg6zRnazZsiSmIGjy8RrMoK6e6dzABL9LbQ&s=10",
    query: "Arijit Singh Best Songs",
    style: { objectPosition: "center" }
  },
  {
    name: "Karan Aujla",
    subtitle: "Global Punjabi Chartbusters.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsAr3TXEFczZuNoXSgNsyFsP0qO5i3_X04BBaiSoZmWQ&s=10",
    query: "Karan Aujla Hits"
  },
  {
    name: "Diljit Dosanjh",
    subtitle: "The G.O.A.T of Punjabi Music.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRiDo6BEsuX2dHDfdqcH2ka_iqQE-nxjv5RFMyFH5ttVg&s=10",
    query: "Diljit Dosanjh Best Songs"
  },
  {
    name: "Shreya Ghoshal",
    subtitle: "The Melody Queen of India.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-JGIliMq0nqcZb3let52YPm5xi0CM5EiukGOHNHAWYw&s=10",
    query: "Shreya Ghoshal Hits"
  }
];

export function HomeDashboard() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  // Existing data
  const { data: recentData, isLoading: recentLoading } = useSWR('/api/recommendations', fetcher, SWR_OPTIONS);
  const { data: playlists } = useSWR('/api/playlists', fetcher, SWR_OPTIONS);

  // New Trending Bollywood data (Playlists!)
  const { data: trendingData, isLoading: trendingLoading } = useSWR(`/api/search?q=Top+Bollywood+Hits+${currentYear}&type=playlist`, fetcher, SWR_OPTIONS);

  const { loadPlaylist, shuffleQueue } = useQueueStore();
  const { setCurrentTrack } = usePlayerStore();

  const handlePlayTrack = useCallback((track: any, contextList?: any[], index?: number) => {
    if (typeof window !== 'undefined' && (window as any).playVideoSync) {
      (window as any).playVideoSync(track.videoId || track.id);
    } else if (typeof window !== 'undefined' && (window as any).playSilentAudio) {
      (window as any).playSilentAudio();
    }

    if (contextList && contextList.length > 0 && typeof index === 'number') {
      const nextTrack = loadPlaylist(contextList, index);
      if (nextTrack) setCurrentTrack(nextTrack);
    } else {
      const nextTrack = loadPlaylist([track], 0);
      if (nextTrack) setCurrentTrack(nextTrack);
    }
  }, [loadPlaylist, setCurrentTrack]);

  const handleShufflePlaylist = useCallback((playlist: any) => {
    if (playlist.tracks && playlist.tracks.length > 0) {
      const shuffledTracks = [...playlist.tracks].sort(() => Math.random() - 0.5);
      const nextTrack = loadPlaylist(shuffledTracks, 0);
      shuffleQueue();
      if (nextTrack) {
        if (typeof window !== 'undefined' && (window as any).playVideoSync) {
          (window as any).playVideoSync(nextTrack.videoId);
        } else if (typeof window !== 'undefined' && (window as any).playSilentAudio) {
          (window as any).playSilentAudio();
        }
        setCurrentTrack(nextTrack);
      }
    }
  }, [loadPlaylist, shuffleQueue, setCurrentTrack]);

  const SectionHeader = ({ title, onSeeAll }: { title: string, onSeeAll: () => void }) => (
    <div className="flex items-center justify-between mb-4 mt-2 px-2 md:px-0">
      <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground">{title}</h2>
      <Button variant="ghost" size="sm" onClick={onSeeAll} className="text-xs md:text-sm font-bold text-muted-foreground hover:text-foreground">
        See All
      </Button>
    </div>
  );

  const trendingTracks = Array.isArray(trendingData) ? trendingData : trendingData?.items || [];
  const validTrendingTracks = trendingTracks.filter((i: any) => i.track || i.videoId).map((i: any) => i.track || i);

  return (
    <div className="flex flex-col gap-8 pb-12 animate-fade-in">

      {/* 1. Mood & Genre Pills */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 -mx-4 px-4 md:mx-0 md:px-0 pb-2">
        {MOODS.map(mood => (
          <button
            key={mood}
            onClick={() => router.push(`/search/${encodeURIComponent(mood + ' Bollywood')}`)}
            className="whitespace-nowrap px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-sm font-bold transition-colors"
          >
            {mood}
          </button>
        ))}
      </div>

      {/* 2. Hero Banner Slider */}
      <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 -mx-4 px-4 md:mx-0 md:px-0">
        {HERO_ARTISTS.map((artist, idx) => (
          <div
            key={idx}
            className="relative min-w-full md:min-w-[85%] lg:min-w-[70%] h-48 md:h-72 rounded-[32px] overflow-hidden cursor-pointer group shadow-2xl snap-center shrink-0"
            onClick={() => router.push(`/search/${encodeURIComponent(artist.query)}`)}
          >
            <Image
              src={artist.image}
              alt={artist.name}
              fill
              sizes="(max-width: 768px) 100vw, 70vw"
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
              style={artist.style}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
            <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full flex items-end justify-between">
              <div>
                <span className="inline-block px-3 py-1 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-md mb-3 shadow-md">Featured</span>
                <h1 className="text-3xl md:text-5xl font-black text-white mb-2 drop-shadow-lg tracking-tight">{artist.name}</h1>
                <p className="text-white/80 text-sm md:text-base font-semibold drop-shadow-md">{artist.subtitle}</p>
              </div>
              <Button size="icon" className="h-14 w-14 rounded-full bg-brand-primary text-white shadow-[0_0_20px_rgba(29,185,84,0.4)] group-hover:scale-110 transition-transform hidden sm:flex">
                <Play className="h-6 w-6 fill-current ml-1" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Trending Bollywood Hits */}
      <section>
        <SectionHeader title="Trending in Bollywood" onSeeAll={() => router.push(`/search/${encodeURIComponent(`Top Bollywood Hits ${currentYear}`)}`)} />
        {trendingLoading ? (
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[140px] md:w-[180px] shrink-0 aspect-square bg-white/5 rounded-[24px] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {validTrendingTracks.slice(0, 5).map((track: any, idx: number) => {
              const coverImg = track.thumbnail || track.thumbnails?.[1]?.url || track.thumbnails?.[0]?.url;
              return (
                <div
                  key={`trend-${track.videoId}`}
                  onClick={() => router.push(`/yt-playlist/${track.videoId}`)}
                  className="group w-[140px] md:w-[180px] shrink-0 cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-square w-full rounded-[24px] overflow-hidden shadow-lg mb-3 bg-white/5">
                    {coverImg ? (
                      <Image
                        src={coverImg}
                        alt={track.title}
                        fill
                        sizes="(max-width: 768px) 140px, 180px"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music2 className="w-10 h-10 text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <Button size="icon" className="h-12 w-12 bg-brand-primary text-white rounded-full shadow-xl hover:scale-110 transition-transform translate-y-4 group-hover:translate-y-0">
                        <Play className="fill-current h-6 w-6 ml-1" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground truncate text-sm md:text-base px-1">{track.title}</h3>
                  <p className="text-muted-foreground font-semibold line-clamp-1 text-xs mt-0.5 px-1">
                    {track.artists?.map((a: any) => a.name).join(', ') || track.channelName || 'Various Artists'}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 4. Based on your recent listening */}
      {recentData?.madeForYou && recentData.madeForYou.length > 0 && (
        <section>
          <SectionHeader title="Jump Back In" onSeeAll={() => router.push('/search')} />
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {recentData.madeForYou.slice(0, 5).map((item: any, idx: number) => (
              <div
                key={`recent-${item.id}`}
                onClick={() => handlePlayTrack(item.data, recentData.madeForYou.slice(0, 5).map((i: any) => i.data), idx)}
                className="group w-[140px] md:w-[180px] shrink-0 cursor-pointer flex flex-col"
              >
                <div className="relative aspect-square w-full rounded-[24px] overflow-hidden shadow-lg mb-3 bg-white/5">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 140px, 180px"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music2 className="w-10 h-10 text-white/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <Button size="icon" className="h-12 w-12 bg-brand-primary text-white rounded-full shadow-xl hover:scale-110 transition-transform translate-y-4 group-hover:translate-y-0">
                      <Play className="fill-current h-6 w-6 ml-1" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-bold text-foreground truncate text-sm md:text-base px-1">{item.title}</h3>
                <p className="text-muted-foreground font-semibold line-clamp-1 text-xs mt-0.5 px-1">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Your Playlists */}
      <section>
        <SectionHeader title="Your Collections" onSeeAll={() => router.push('/profile')} />
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">

          {/* Liked Songs Card */}
          <div
            onClick={() => router.push('/collection/tracks')}
            className="group w-[140px] md:w-[180px] shrink-0 cursor-pointer flex flex-col"
          >
            <div className="relative aspect-square w-full rounded-[24px] overflow-hidden bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg mb-3">
              <Heart className="h-12 w-12 md:h-16 md:w-16 text-white fill-white drop-shadow-md group-hover:scale-110 transition-transform duration-500" />
            </div>
            <h3 className="font-bold text-foreground text-sm md:text-base truncate px-1">Liked Songs</h3>
            <p className="text-muted-foreground font-semibold text-xs mt-0.5 px-1">Your favorites</p>
          </div>

          {/* User Playlists */}
          {Array.isArray(playlists) && playlists.slice(0, 4).map((pl: any) => (
            <div
              key={`pl-${pl._id}`}
              onClick={() => router.push(`/playlist/${pl._id}`)}
              className="group w-[140px] md:w-[180px] shrink-0 cursor-pointer flex flex-col"
            >
              <div className="relative aspect-square w-full rounded-[24px] overflow-hidden shadow-lg mb-3 bg-white/5 flex items-center justify-center">
                {(() => {
                  const hasTracks = pl.tracks && pl.tracks.length > 0;
                  const firstTrack = hasTracks ? pl.tracks[0] : null;
                  const imgSrc = firstTrack ? (typeof firstTrack.thumbnails?.high === 'string' ? firstTrack.thumbnails.high : (firstTrack.thumbnails?.high as any)?.url || typeof firstTrack.thumbnails?.default === 'string' ? firstTrack.thumbnails.default : (firstTrack.thumbnails?.default as any)?.url || '') : null;

                  return imgSrc ? (
                    <Image
                      src={imgSrc}
                      alt={pl.name}
                      fill
                      sizes="(max-width: 768px) 140px, 180px"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : <Music2 className="w-10 h-10 text-white/30" />;
                })()}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <Button
                    size="icon"
                    className="h-12 w-12 bg-brand-primary text-white rounded-full shadow-xl hover:scale-110 transition-transform translate-y-4 group-hover:translate-y-0"
                    onClick={(e) => { e.stopPropagation(); handleShufflePlaylist(pl); }}
                    disabled={!pl.tracks || pl.tracks.length === 0}
                  >
                    <Shuffle className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <h3 className="font-bold text-foreground text-sm md:text-base truncate px-1">{pl.name}</h3>
              <p className="text-muted-foreground font-semibold text-xs mt-0.5 px-1">
                {pl.tracks?.length || 0} tracks
              </p>
            </div>
          ))}

        </div>
      </section>

    </div>
  );
}
