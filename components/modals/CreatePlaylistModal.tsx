'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

import { toast } from 'sonner';
import { mutate } from 'swr';

export function CreatePlaylistModal({ isOpen, onClose }: CreatePlaylistModalProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      
      if (res.ok) {
        toast.success('Playlist created!');
        setName('');
        mutate('/api/playlists');
        onClose();
      } else {
        toast.error('Failed to create playlist');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Playlist</DialogTitle>
          <DialogDescription>
            Give your new playlist a name.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My awesome playlist"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleCreate} disabled={isLoading || !name.trim()}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
