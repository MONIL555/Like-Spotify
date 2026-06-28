'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function AccountSettings() {
  const { user, mutate } = useAuth();
  
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, email, avatarUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update account');

      await mutate();
      toast.success('Account updated successfully');
    } catch (err: any) {
      toast.error('Error', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="max-w-md space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold mb-1">Account Overview</h2>
        <p className="text-sm text-muted-foreground">Manage your profile details.</p>
      </div>

      <div className="flex items-center gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={avatarUrl || ''} />
          <AvatarFallback className="text-3xl" style={{ backgroundColor: user.avatarColor }}>
            {displayName?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-2 flex-1">
          <Label htmlFor="avatarUrl">Avatar URL</Label>
          <Input 
            id="avatarUrl" 
            value={avatarUrl} 
            onChange={(e) => setAvatarUrl(e.target.value)} 
            placeholder="https://example.com/avatar.jpg"
          />
          <p className="text-xs text-muted-foreground">Direct image links work best.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input 
            id="displayName" 
            value={displayName} 
            onChange={(e) => setDisplayName(e.target.value)} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input 
            id="email" 
            type="email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={isLoading} className="bg-brand-primary text-white hover:bg-brand-hover">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </div>
  );
}
