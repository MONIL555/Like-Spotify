'use client';

import { useAuth } from '@/hooks/useAuth';
import { User, Mail, Calendar, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <User className="h-16 w-16 text-white/20" />
        <h2 className="text-2xl font-bold">Not Logged In</h2>
        <p className="text-white/50 text-center max-w-sm mb-4">
          You need to be logged in to view your profile.
        </p>
        <Button onClick={() => router.push('/login')} className="bg-white text-black hover:bg-white/90 rounded-full px-8">
          Log In
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col animate-fade-in min-h-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-end gap-4 p-4 md:p-6 bg-gradient-to-b from-zinc-800/80 to-background">
        <div className="w-40 h-40 md:w-52 md:h-52 shadow-2xl flex-shrink-0 rounded-full overflow-hidden border-4 border-white/10 relative">
          <Avatar className="w-full h-full">
            <AvatarImage src={user?.avatarUrl || ''} alt={user?.displayName || ''} />
            <AvatarFallback className="text-6xl" style={{ backgroundColor: user?.avatarColor || '#3B82F6', color: 'white' }}>
              {user?.displayName?.[0]?.toUpperCase() || <User className="h-20 w-20" />}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <span className="text-sm font-bold uppercase tracking-wider hidden md:block text-white/70">Profile</span>
          <h1 className="text-4xl md:text-7xl font-bold tracking-tighter text-white mb-2 line-clamp-1">
            {user?.displayName || 'User'}
          </h1>
          <div className="flex items-center gap-2 text-sm font-semibold text-white/50">
            <Mail className="h-4 w-4" />
            <span>{user?.email || 'No email provided'}</span>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-4 md:p-6 max-w-4xl space-y-6">
        <section>
          <h2 className="text-2xl font-bold mb-4">Account Overview</h2>
          <div className="glass-card rounded-xl p-4 flex flex-col gap-3 bg-white/5 border border-white/5">
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-white/60">Display Name</span>
              <span className="font-medium">{user?.displayName || 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-white/60">Email</span>
              <span className="font-medium">{user?.email || 'Not set'}</span>
            </div>
            {user?.role && user.role !== 'user' && (
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-white/60">Role</span>
                <span className="font-medium capitalize">{user.role}</span>
              </div>
            )}
          </div>
        </section>

        <section className="flex items-center gap-4">
          <Button 
            onClick={() => router.push('/settings')} 
            variant="outline"
            className="rounded-full border-white/10 hover:bg-white/10 hover:text-white"
          >
            <Settings className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
          <Button 
            onClick={logout} 
            variant="destructive"
            className="rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border-none"
          >
            Log Out
          </Button>
        </section>
      </div>
    </div>
  );
}
