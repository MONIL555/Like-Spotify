'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function AdminPage() {
  const { user } = useAuth();
  
  const [config, setConfig] = useState({
    phoneAuthEnabled: true,
    youtubeFallbackEnabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);

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
        setIsLoading(false);
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

      <div className="clay-panel p-8">
        <h2 className="text-2xl font-bold mb-4">Feature Flags</h2>
        {isLoading ? (
          <div className="text-white/50 animate-pulse">Loading settings...</div>
        ) : (
          <div className="space-y-4 max-w-md">
            
            {/* Phone Auth Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div>
                <h3 className="font-semibold text-white">Phone Authentication</h3>
                <p className="text-xs text-white/50 mt-1">Allow users to sign in and register using OTP via SMS.</p>
              </div>
              <button
                onClick={() => toggleFlag('phoneAuthEnabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${config.phoneAuthEnabled ? 'bg-brand-primary' : 'bg-white/20'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.phoneAuthEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* YouTube Fallback Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div>
                <h3 className="font-semibold text-white">YouTube Player Fallback</h3>
                <p className="text-xs text-white/50 mt-1">Use the invisible YouTube player to stream tracks missing native audio.</p>
              </div>
              <button
                onClick={() => toggleFlag('youtubeFallbackEnabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${config.youtubeFallbackEnabled ? 'bg-brand-primary' : 'bg-white/20'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.youtubeFallbackEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
