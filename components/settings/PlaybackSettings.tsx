'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function PlaybackSettings() {
  const { data: prefs, mutate } = useSWR('/api/preferences', fetcher);
  const [normalization, setNormalization] = useState(true);
  const [crossfade, setCrossfade] = useState(0);

  useEffect(() => {
    if (prefs) {
      setNormalization(prefs.normalization ?? true);
      setCrossfade(prefs.crossfadeDuration ?? 0);
    }
  }, [prefs]);

  const updatePreference = async (key: string, value: any) => {
    try {
      // Optimistic update
      if (key === 'normalization') setNormalization(value);
      if (key === 'crossfadeDuration') setCrossfade(value);

      const res = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });

      if (!res.ok) throw new Error('Failed to update preference');
      mutate(); // revalidate
    } catch (err: any) {
      toast.error('Error', { description: err.message });
      // Revert on error
      mutate();
    }
  };

  if (!prefs) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="max-w-md space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold mb-1">Playback Settings</h2>
        <p className="text-sm text-muted-foreground">Customize your listening experience.</p>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1 pr-4">
            <Label>Audio Normalization</Label>
            <p className="text-sm text-muted-foreground">Set the same volume level for all songs.</p>
          </div>
          <Switch 
            checked={normalization} 
            onCheckedChange={(val) => updatePreference('normalization', val)} 
            className="data-[state=checked]:bg-brand-primary"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Crossfade</Label>
            <span className="text-sm text-muted-foreground font-mono">{crossfade}s</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Allow a smooth transition between songs in a playlist. (Visual stub)
          </p>
          <Slider 
            value={[crossfade]} 
            min={0} 
            max={12} 
            step={1}
            onValueChange={(val: number | readonly number[]) => {
              const v = Array.isArray(val) ? val[0] : (val as number);
              setCrossfade(v);
            }}
            onValueCommitted={(val: number | readonly number[]) => {
              const v = Array.isArray(val) ? val[0] : (val as number);
              updatePreference('crossfadeDuration', v);
            }}
          />
        </div>
      </div>
    </div>
  );
}
