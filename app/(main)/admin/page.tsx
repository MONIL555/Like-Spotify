'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { Users, ListMusic, Activity, Clock, Music, TrendingUp, Shield, HardDrive } from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours.toLocaleString()}h ${minutes}m`;
  return `${minutes}m`;
}

export default function AdminPage() {
  const { user } = useAuth();
  
  // Feature flags
  const [config, setConfig] = useState({
    phoneAuthEnabled: true,
    youtubeFallbackEnabled: true,
  });
  const [isConfigLoading, setIsConfigLoading] = useState(true);

  // Analytics
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useSWR(
    user?.role === 'admin' ? '/api/admin/analytics' : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const analytics = analyticsData?.success ? analyticsData.data : null;

  // Fetch config
  useEffect(() => {
    if (user?.role !== 'admin') return;

    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/admin/config');
        const json = await res.json();
        if (json.success && json.data) {
          setConfig({
            phoneAuthEnabled: json.data.phoneAuthEnabled,
            youtubeFallbackEnabled: json.data.youtubeFallbackEnabled,
          });
        }
      } catch (err) {
        console.error('Failed to fetch config', err);
      } finally {
        setIsConfigLoading(false);
      }
    };

    fetchConfig();
  }, [user]);

  const toggleFlag = async (key: 'phoneAuthEnabled' | 'youtubeFallbackEnabled') => {
    const newValue = !config[key];
    
    // Optimistic UI update
    setConfig(prev => ({ ...prev, [key]: newValue }));

    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: newValue }),
      });
      const json = await res.json();
      
      if (!json.success) throw new Error('Failed to update config');
      toast.success(`${key === 'phoneAuthEnabled' ? 'Phone Authentication' : 'YouTube Fallback'} ${newValue ? 'Enabled' : 'Disabled'}`);
    } catch (err) {
      // Revert on failure
      setConfig(prev => ({ ...prev, [key]: !newValue }));
      toast.error('Failed to update feature flag');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="py-12 text-center animate-fade-in">
        <Shield className="h-16 w-16 text-destructive mx-auto mb-4 opacity-50" />
        <h3 className="text-2xl font-bold text-destructive">Unauthorized Access</h3>
        <p className="text-muted-foreground text-sm mt-2">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="py-2 md:py-6 px-4 md:px-8 flex flex-col gap-8 animate-fade-in pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between w-full gap-4 md:gap-4">
        <div className="flex items-start justify-between w-full md:w-auto">
          <div className="flex flex-col justify-center min-w-0 py-2">
            <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-1">Admin Dashboard</h1>
            <p className="text-sm md:text-base font-medium text-muted-foreground">System overview & controls</p>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-full bg-brand-primary/20 flex md:hidden items-center justify-center text-brand-primary ml-4 mt-2">
            <Shield className="h-5 w-5" />
          </div>
        </div>
        
        <div className="flex items-center gap-3 md:mt-2 flex-wrap">
          <Link href="/admin/admin-picks" className="text-sm bg-brand-primary text-black hover:bg-brand-primary/90 px-4 py-2 rounded-full transition-colors flex items-center gap-2 font-bold">
            <Music className="w-4 h-4" /> Admin Picks
          </Link>
          <Link href="/admin/cached-tracks" className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-colors flex items-center gap-2 font-medium">
            <HardDrive className="w-4 h-4" /> Manage Cache
          </Link>
          <div className="h-10 w-10 shrink-0 rounded-full bg-brand-primary/20 hidden md:flex items-center justify-center text-brand-primary">
            <Shield className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xl md:text-2xl font-bold">System Analytics</h2>
        
        {analyticsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 animate-pulse">
                <div className="h-3 w-20 bg-white/10 rounded mb-3" />
                <div className="h-8 w-16 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        ) : analyticsError ? (
          <div className="py-8 text-center text-muted-foreground rounded-xl border-dashed border-2 border-border/50">
            <p className="font-semibold text-sm mb-1">Failed to load analytics</p>
            <p className="text-xs">Check your connection and try again.</p>
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={<Users className="h-4 w-4" />}
              label="Total Users"
              value={analytics.totalUsers?.toLocaleString() || '0'}
              color="text-brand-primary"
            />
            <StatCard
              icon={<ListMusic className="h-4 w-4" />}
              label="Playlists"
              value={analytics.totalPlaylists?.toLocaleString() || '0'}
              color="text-blue-500"
            />
            <StatCard
              icon={<Activity className="h-4 w-4" />}
              label="Active (7d)"
              value={analytics.activeUsers?.toLocaleString() || '0'}
              color="text-emerald-400"
            />
            <StatCard
              icon={<Clock className="h-4 w-4" />}
              label="Listen Time"
              value={formatDuration(analytics.totalListeningSeconds || 0)}
              color="text-amber-400"
            />
          </div>
        ) : null}
      </div>

      {/* Feature Flags */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xl md:text-2xl font-bold">Feature Flags</h2>
        
        {isConfigLoading ? (
          <div className="space-y-3 max-w-lg">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 animate-pulse">
                <div className="h-4 w-40 bg-white/10 rounded mb-2" />
                <div className="h-3 w-64 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 max-w-lg">
            <FlagToggle
              label="Phone Authentication"
              description="Allow users to sign in and register using OTP via SMS."
              enabled={config.phoneAuthEnabled}
              onToggle={() => toggleFlag('phoneAuthEnabled')}
            />
            <FlagToggle
              label="YouTube Player Fallback"
              description="Use the invisible YouTube player to stream tracks missing native audio. When disabled, only JioSaavn tracks will play."
              enabled={config.youtubeFallbackEnabled}
              onToggle={() => toggleFlag('youtubeFallbackEnabled')}
            />
          </div>
        )}
      </div>

      {/* Top Tracks */}
      {analytics?.topTracks && analytics.topTracks.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-primary" />
            <h2 className="text-xl md:text-2xl font-bold">Top Tracks</h2>
          </div>
          <div className="flex flex-col">
            {analytics.topTracks.map((track: any, index: number) => {
              const thumb = typeof track.thumbnails?.default === 'string'
                ? track.thumbnails.default
                : track.thumbnails?.default?.url || '';
              
              return (
                <div
                  key={track.videoId}
                  className="flex items-center gap-3 px-2 md:px-3 py-2 rounded-xl hover:bg-surface-hover transition-colors"
                >
                  <span className="text-xs font-bold text-muted-foreground w-5 text-right shrink-0">
                    {index + 1}
                  </span>
                  <div className="h-9 w-9 md:h-11 md:w-11 rounded-lg overflow-hidden bg-white/5 shrink-0">
                    {thumb ? (
                      <img src={thumb} alt={track.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <Music className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs md:text-sm text-foreground truncate">{track.title}</p>
                    <p className="text-[10px] md:text-xs font-semibold text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-brand-primary">{track.playCount} plays</p>
                    <p className="text-[10px] text-muted-foreground">{formatDuration(track.totalDuration)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Users */}
      {analytics?.topUsers && analytics.topUsers.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl md:text-2xl font-bold">Top Listeners</h2>
          </div>
          <div className="flex flex-col">
            {analytics.topUsers.map((item: any, index: number) => (
              <div
                key={item._id}
                className="flex items-center gap-3 px-2 md:px-3 py-2 rounded-xl hover:bg-surface-hover transition-colors"
              >
                <span className="text-xs font-bold text-muted-foreground w-5 text-right shrink-0">
                  {index + 1}
                </span>
                <div
                  className="h-9 w-9 md:h-11 md:w-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: item.user?.avatarColor || '#1DB954' }}
                >
                  {item.user?.avatarUrl ? (
                    <img src={item.user.avatarUrl} alt={item.user.displayName} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    (item.user?.displayName || '?').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs md:text-sm text-foreground truncate">
                    {item.user?.displayName || 'Unknown User'}
                  </p>
                  <p className="text-[10px] md:text-xs font-semibold text-muted-foreground truncate">
                    {item.user?.email}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-blue-500">{formatDuration(item.totalDuration)}</p>
                  
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 transition-colors hover:bg-white/[0.07]">
      <div className={`flex items-center gap-1.5 mb-2 ${color}`}>
        {icon}
        <span className="text-muted-foreground font-semibold text-xs md:text-sm uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl md:text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function FlagToggle({ label, description, enabled, onToggle }: { label: string; description: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 transition-colors hover:bg-white/[0.07] gap-4">
      <div className="min-w-0">
        <h3 className="font-bold text-sm text-foreground">{label}</h3>
        <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${
          enabled ? 'bg-brand-primary' : 'bg-white/20'
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>
  );
}
