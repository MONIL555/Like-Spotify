'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Users, Clock, PlayCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

interface AnalyticsData {
  totalUsers: number;
  totalListeningSeconds: number;
  topUsers: any[];
  topTracks: any[];
}

function formatListeningTime(seconds: number) {
  if (!seconds) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/admin/analytics');
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-center text-muted-foreground">Failed to load analytics data.</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Admin Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-black/5 border-none shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-black/5 border-none shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Listening Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatListeningTime(data.totalListeningSeconds)}</div>
          </CardContent>
        </Card>

        <Card className="bg-black/5 border-none shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Tracks Played</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.topTracks.length > 0 ? data.topTracks.reduce((acc, curr) => acc + curr.playCount, 0) : 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="bg-black/5 border-none shadow-none">
          <CardHeader>
            <CardTitle>Top Listeners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topUsers.length === 0 ? (
                <div className="text-sm text-muted-foreground">No data available.</div>
              ) : (
                data.topUsers.map((item, index) => (
                  <div key={item._id} className="flex items-center">
                    <div className="w-8 text-center text-sm font-bold text-muted-foreground mr-2">{index + 1}</div>
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.user.avatarUrl ? (
                        <Image src={item.user.avatarUrl} alt={item.user.displayName} width={40} height={40} className="object-cover" />
                      ) : (
                        <span className="text-xs font-medium" style={{ color: item.user.avatarColor || '#1DB954' }}>
                          {item.user.displayName?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="ml-4 space-y-1 flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">{item.user.displayName}</p>
                      <p className="text-sm text-muted-foreground truncate">{item.user.email}</p>
                    </div>
                    <div className="ml-auto font-medium text-brand-primary">
                      {formatListeningTime(item.totalDuration)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/5 border-none shadow-none">
          <CardHeader>
            <CardTitle>Top Tracks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topTracks.length === 0 ? (
                <div className="text-sm text-muted-foreground">No data available.</div>
              ) : (
                data.topTracks.map((track, index) => (
                  <div key={track.videoId} className="flex items-center">
                    <div className="w-8 text-center text-sm font-bold text-muted-foreground mr-2">{index + 1}</div>
                    <div className="relative h-10 w-10 overflow-hidden rounded bg-muted flex-shrink-0">
                      {(track.thumbnails?.default || track.thumbnails?.medium) && (
                        <Image
                          src={track.thumbnails.default?.url || track.thumbnails.medium?.url || track.thumbnails.default || track.thumbnails.medium || '/default-cover.png'}
                          alt={track.title}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="ml-4 space-y-1 flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">{track.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                    </div>
                    <div className="ml-auto flex flex-col items-end">
                      <span className="font-medium">{track.playCount} plays</span>
                      <span className="text-xs text-muted-foreground">{formatListeningTime(track.totalDuration)} total</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
