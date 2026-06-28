'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';
import { mutate } from 'swr';

export function DataSettings() {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all your recently played history? This cannot be undone.')) {
      return;
    }

    try {
      setIsClearing(true);
      const res = await fetch('/api/users/me/history', {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to clear history');

      toast.success('Listening history cleared');
      
      // Tell SWR to revalidate recommendations so the Home page updates
      mutate('/api/recommendations');
    } catch (err: any) {
      toast.error('Error', { description: err.message });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="max-w-md space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold mb-1">Data & Privacy</h2>
        <p className="text-sm text-muted-foreground">Manage your personal data.</p>
      </div>

      <div className="space-y-6">
        <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-md flex flex-col gap-4 items-start">
          <div className="flex items-center gap-2 text-destructive font-semibold">
            <AlertTriangle className="h-5 w-5" />
            Clear Listening History
          </div>
          <p className="text-sm text-muted-foreground">
            This will permanently remove all records of songs you have listened to. It will reset your "Recently Played" section on the Home page.
          </p>
          <Button 
            variant="destructive" 
            onClick={handleClearHistory}
            disabled={isClearing}
          >
            {isClearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Clear History
          </Button>
        </div>
      </div>
    </div>
  );
}
