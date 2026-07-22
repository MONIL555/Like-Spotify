'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { Shield, Search, Plus, Trash2, ArrowLeft, Music, Loader2 } from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminPicksPage() {
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [addingTrack, setAddingTrack] = useState<string | null>(null);
  const [removingTrack, setRemovingTrack] = useState<string | null>(null);

  // Current curated tracks
  const { data: curatedData, mutate: mutateCurated } = useSWR('/api/admin/curated-tracks?category=admin_picks', fetcher);
  const curatedTracks = curatedData?.success ? curatedData.data : [];

  // Search Results
  const { data: searchData, isLoading: searchLoading } = useSWR(
    debouncedQuery.trim() ? `/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=10` : null,
    fetcher
  );
  
  const searchResults = Array.isArray(searchData) ? searchData : (searchData?.items || []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddTrack = async (track: any) => {
    if (curatedTracks.length >= 50) {
      toast.error('Maximum limit of 50 tracks reached.');
      return;
    }
    
    // Prevent duplicate adds from UI
    if (curatedTracks.some((t: any) => t.videoId === (track.videoId || track.id))) {
      toast.error('Track is already in the list.');
      return;
    }

    setAddingTrack(track.videoId || track.id);
    try {
      const res = await fetch('/api/admin/curated-tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: track.videoId || track.id,
          saavnId: track.saavnId,
          title: track.title,
          artist: track.artist || track.channelTitle || track.channelName || 'Unknown Artist',
          imageUrl: typeof track.thumbnail === 'string' ? track.thumbnail :
                    typeof track.thumbnails?.high === 'string' ? track.thumbnails.high :
                    track.thumbnails?.high?.url ? track.thumbnails.high.url :
                    typeof track.thumbnails?.default === 'string' ? track.thumbnails.default :
                    track.thumbnails?.default?.url ? track.thumbnails.default.url :
                    Array.isArray(track.thumbnails) ? (track.thumbnails[0]?.url || track.thumbnails[0]) : '',
          source: track.source || 'youtube',
          category: 'admin_picks',
        }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to add track');
      }
      toast.success('Track added to Admin Picks');
      mutateCurated();
      setSearchQuery('');
    } catch (err: any) {
      toast.error(err.message || 'Error adding track');
    } finally {
      setAddingTrack(null);
    }
  };

  const handleRemoveTrack = async (videoId: string) => {
    setRemovingTrack(videoId);
    try {
      const res = await fetch(`/api/admin/curated-tracks?videoId=${videoId}&category=admin_picks`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to remove track');
      }
      toast.success('Track removed');
      mutateCurated();
    } catch (err: any) {
      toast.error(err.message || 'Error removing track');
    } finally {
      setRemovingTrack(null);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="py-12 text-center animate-fade-in">
        <Shield className="h-16 w-16 text-destructive mx-auto mb-4 opacity-50" />
        <h3 className="text-2xl font-bold text-destructive">Unauthorized Access</h3>
      </div>
    );
  }

  return (
    <div className="py-2 md:py-6 px-4 md:px-8 flex flex-col gap-6 animate-fade-in pb-32">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin Picks</h1>
          <p className="text-sm font-medium text-muted-foreground">Manage the tracks shown in the home screen "Admin Picks" section.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: Search & Add */}
        <div className="flex flex-col gap-4">
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <h2 className="text-xl font-bold mb-4">Search Tracks</h2>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search JioSaavn or Cached songs..."
                className="w-full bg-black/40 border border-white/10 rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:border-brand-primary/50 text-sm font-medium text-foreground"
              />
            </div>

            {searchLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {searchResults.map((track: any) => {
                  const id = track.videoId || track.id;
                  const thumb = track.thumbnail || track.thumbnails?.default || '';
                  const isAdded = curatedTracks.some((t: any) => t.videoId === id);
                  const isAdding = addingTrack === id;

                  return (
                    <div key={id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 group transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded bg-white/10 shrink-0 overflow-hidden">
                          {thumb ? <img src={thumb} alt="Cover" className="w-full h-full object-cover" /> : <Music className="w-5 h-5 m-2.5 text-muted-foreground" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{track.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{track.artist || track.channelTitle}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddTrack(track)}
                        disabled={isAdded || isAdding}
                        className={`shrink-0 ml-4 p-2 rounded-full transition-colors ${
                          isAdded ? 'bg-emerald-500/20 text-emerald-500 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : debouncedQuery ? (
              <div className="text-center py-8 text-muted-foreground text-sm font-medium">
                No tracks found for "{debouncedQuery}"
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Side: Current List */}
        <div className="flex flex-col gap-4">
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Curated List</h2>
              <div className="text-sm font-bold px-3 py-1 bg-black/40 rounded-full border border-white/10">
                <span className={curatedTracks.length < 20 ? 'text-amber-400' : 'text-emerald-400'}>
                  {curatedTracks.length}
                </span>
                <span className="text-muted-foreground"> / 50</span>
              </div>
            </div>

            {curatedTracks.length < 20 && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs font-medium">
                Recommendation: Add at least 20 tracks for a better shuffled experience.
              </div>
            )}

            <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {curatedTracks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm font-medium border border-dashed border-white/10 rounded-lg">
                  No tracks added yet. Search and add tracks to build the pool.
                </div>
              ) : (
                curatedTracks.map((track: any) => (
                  <div key={track.videoId} className="flex items-center justify-between p-2 rounded-lg bg-black/20 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded bg-white/10 shrink-0 overflow-hidden">
                        {track.imageUrl ? <img src={track.imageUrl} alt="Cover" className="w-full h-full object-cover" /> : <Music className="w-5 h-5 m-2.5 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{track.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveTrack(track.videoId)}
                      disabled={removingTrack === track.videoId}
                      className="shrink-0 ml-4 p-2 rounded-full text-destructive hover:bg-destructive/20 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                    >
                      {removingTrack === track.videoId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
