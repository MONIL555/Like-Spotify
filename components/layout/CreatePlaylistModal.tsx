'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useSWRConfig } from 'swr';

export function CreatePlaylistModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { mutate } = useSWRConfig();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        mutate('/api/playlists');
        setName('');
        onClose();
        router.push(`/playlist/${data._id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-white/5 border border-white/10 rounded-[1.5rem] w-full max-w-md p-6 sm:p-8 shadow-2xl animate-slide-up overflow-hidden backdrop-blur-2xl">
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none" />
        
        <div className="relative z-10 flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-md">Create Playlist</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-white/70 ml-1">Playlist Name</label>
            <Input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Playlist"
              className="bg-white/5 border-white/10 focus:border-brand-primary/50 focus:bg-white/10 text-white placeholder:text-white/30 h-12 rounded-lg text-base transition-all"
              autoFocus
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10 font-bold"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className={`h-10 px-6 rounded-lg text-white font-bold text-sm transition-all shadow-[0_0_15px_rgba(29,185,84,0.3)] border-none ${
                !name.trim() || loading
                  ? 'bg-white/10 cursor-not-allowed opacity-70 text-white/50 shadow-none'
                  : 'bg-gradient-to-r from-brand-primary to-brand-secondary hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(29,185,84,0.5)]'
              }`}
              disabled={!name.trim() || loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
