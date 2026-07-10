'use client';

import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/avatar';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <div className="py-6 flex flex-col gap-8 animate-fade-in">
      <div className="clay-panel p-12 flex flex-col items-center justify-center text-center">
        <Avatar 
          size="xl" 
          src={user?.avatarUrl} 
          fallbackColor={user?.avatarColor}
          alt={user?.displayName}
          className="mb-6 h-32 w-32 shadow-xl"
        />
        <h1 className="text-4xl font-bold text-foreground mb-2">{user?.displayName}</h1>
        <p className="text-lg font-semibold text-muted-foreground mb-8">{user?.email}</p>
        
        <div className="flex gap-4">
          <div className="clay-inset px-6 py-4 rounded-2xl flex flex-col items-center min-w-[120px]">
            <span className="text-3xl font-bold text-brand-primary">12</span>
            <span className="text-sm font-semibold text-muted-foreground">Playlists</span>
          </div>
          <div className="clay-inset px-6 py-4 rounded-2xl flex flex-col items-center min-w-[120px]">
            <span className="text-3xl font-bold text-brand-secondary">428</span>
            <span className="text-sm font-semibold text-muted-foreground">Followers</span>
          </div>
        </div>
      </div>
    </div>
  );
}
