'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function PasswordSettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    
    if (newPassword.length < 8) {
      return toast.error('New password must be at least 8 characters');
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/users/me/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error('Error', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold mb-1">Change Password</h2>
        <p className="text-sm text-muted-foreground">Keep your account secure.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current Password</Label>
          <Input 
            id="currentPassword" 
            type="password"
            value={currentPassword} 
            onChange={(e) => setCurrentPassword(e.target.value)} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <Input 
            id="newPassword" 
            type="password"
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input 
            id="confirmPassword" 
            type="password"
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
          />
        </div>
      </div>

      <Button 
        onClick={handleSave} 
        disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Update Password
      </Button>
    </div>
  );
}
