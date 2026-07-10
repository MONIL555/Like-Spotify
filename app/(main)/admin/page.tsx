'use client';

import { useAuth } from '@/hooks/useAuth';

export default function AdminPage() {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return (
      <div className="clay-card p-12 text-center mt-12 animate-fade-in">
        <h3 className="text-2xl font-bold text-destructive">Unauthorized Access</h3>
      </div>
    );
  }

  return (
    <div className="py-6 flex flex-col gap-8 animate-fade-in">
      <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
      <div className="clay-panel p-8">
        <h2 className="text-2xl font-bold mb-4">System Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="clay-inset p-6 rounded-2xl">
            <h3 className="text-muted-foreground font-semibold mb-2">Total Users</h3>
            <p className="text-4xl font-bold text-brand-primary">1,204</p>
          </div>
          <div className="clay-inset p-6 rounded-2xl">
            <h3 className="text-muted-foreground font-semibold mb-2">Total Playlists</h3>
            <p className="text-4xl font-bold text-brand-secondary">8,432</p>
          </div>
          <div className="clay-inset p-6 rounded-2xl">
            <h3 className="text-muted-foreground font-semibold mb-2">Active Streams</h3>
            <p className="text-4xl font-bold text-brand-tertiary">42</p>
          </div>
        </div>
      </div>
    </div>
  );
}
