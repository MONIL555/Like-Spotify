'use client';

import { useState, useEffect } from 'react';
import { User, Lock, Database, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useHistoryStore } from '@/store/historyStore';
import { toast } from 'sonner';

export function SettingsDashboard() {
  const [activeTab, setActiveTab] = useState('account');
  const { user, mutate, logout } = useAuth();
  const clearHistory = useHistoryStore(state => state.clearHistory);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!displayName || !email) return toast.error('Fields cannot be empty');
    setIsUpdating(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      await mutate();
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) return toast.error('Passwords cannot be empty');
    setIsUpdating(true);
    try {
      const res = await fetch('/api/users/me/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');
      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearHistory = () => {
    clearHistory();
    toast.success('Listening history cleared');
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-12 animate-fade-in">
      {/* Sidebar / Tabs */}
      <div className="w-full md:w-64 flex flex-row md:flex-col gap-2 overflow-x-auto hide-scrollbar shrink-0 border-b md:border-b-0 border-border pb-2 md:pb-0">
        <button
          onClick={() => setActiveTab('account')}
          className={`flex items-center justify-center md:justify-start gap-2 px-3 md:px-4 py-2 md:py-3 rounded-lg font-bold transition-all whitespace-nowrap text-sm ${
            activeTab === 'account' ? 'bg-white/10 text-brand-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
          }`}
        >
          <User className="h-4 w-4 md:h-5 md:w-5 shrink-0" /> 
          <span className={activeTab === 'account' ? 'block' : 'hidden md:block'}>Account</span>
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`flex items-center justify-center md:justify-start gap-2 px-3 md:px-4 py-2 md:py-3 rounded-lg font-bold transition-all whitespace-nowrap text-sm ${
            activeTab === 'password' ? 'bg-white/10 text-brand-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
          }`}
        >
          <Lock className="h-4 w-4 md:h-5 md:w-5 shrink-0" /> 
          <span className={activeTab === 'password' ? 'block' : 'hidden md:block'}>Password</span>
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center justify-center md:justify-start gap-2 px-3 md:px-4 py-2 md:py-3 rounded-lg font-bold transition-all whitespace-nowrap text-sm ${
            activeTab === 'data' ? 'bg-white/10 text-brand-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
          }`}
        >
          <Database className="h-4 w-4 md:h-5 md:w-5 shrink-0" /> 
          <span className={activeTab === 'data' ? 'block' : 'hidden md:block'}>Data & Privacy</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-2xl">
        <div className="md:p-4">
          {activeTab === 'account' && (
            <div className="space-y-4 md:space-y-6 animate-fade-in">
              <h2 className="text-xl md:text-2xl font-bold">Account Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-bold text-muted-foreground mb-1 md:mb-2">Display Name</label>
                  <Input 
                    placeholder="Your name" 
                    className="h-10 bg-white/5 border-none focus-visible:ring-1 focus-visible:ring-brand-primary" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold text-muted-foreground mb-1 md:mb-2">Email Address</label>
                  <Input 
                    placeholder="name@example.com" 
                    type="email" 
                    className="h-10 bg-white/5 border-none focus-visible:ring-1 focus-visible:ring-brand-primary" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleUpdateProfile} 
                  disabled={isUpdating || (displayName === user?.displayName && email === user?.email)}
                  variant="brand" 
                  className="mt-2 w-full md:w-auto"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="space-y-4 md:space-y-6 animate-fade-in">
              <h2 className="text-xl md:text-2xl font-bold">Change Password</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-bold text-muted-foreground mb-1 md:mb-2">Current Password</label>
                  <Input 
                    type="password" 
                    className="h-10 bg-white/5 border-none focus-visible:ring-1 focus-visible:ring-brand-primary" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold text-muted-foreground mb-1 md:mb-2">New Password</label>
                  <Input 
                    type="password" 
                    className="h-10 bg-white/5 border-none focus-visible:ring-1 focus-visible:ring-brand-primary" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleUpdatePassword}
                  disabled={isUpdating || !currentPassword || !newPassword}
                  variant="brand" 
                  className="mt-2 w-full md:w-auto"
                >
                  Update Password
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl md:text-2xl font-bold mb-2">Data & Privacy</h2>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-3 md:py-4 border-b border-border">
                <div>
                  <h3 className="font-bold text-sm md:text-base">Clear Listening History</h3>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Remove all tracks from your recent history. This cannot be undone.</p>
                </div>
                <Button 
                  onClick={handleClearHistory}
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:bg-destructive/10 shrink-0 self-start md:self-auto h-8 px-3 text-xs md:text-sm"
                >
                  Clear History
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
