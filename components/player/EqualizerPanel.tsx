'use client';

import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PRESETS = {
  flat: [0, 0, 0, 0, 0],
  bass_boost: [6, 4, 0, 0, 0],
  acoustic: [3, 1, 0, 1, 3],
  electronic: [4, -2, 0, 2, 4],
  vocal: [-2, 0, 4, 3, 1],
};

const BANDS = ['60Hz', '230Hz', '910Hz', '3.6kHz', '14kHz'];

export function EqualizerPanel() {
  const [activePreset, setActivePreset] = useState<keyof typeof PRESETS>('flat');
  const [bandValues, setBandValues] = useState<number[]>(PRESETS.flat);

  const handlePresetChange = (val: string) => {
    const preset = val as keyof typeof PRESETS;
    setActivePreset(preset);
    setBandValues(PRESETS[preset]);
  };

  const handleBandChange = (index: number, value: number[]) => {
    const val = value[0];
    const newBands = [...bandValues];
    newBands[index] = val;
    setBandValues(newBands);
    setActivePreset('flat'); // Custom
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 mb-4 mr-4" align="center" side="top">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-brand-primary" />
              <h4 className="font-semibold">Equalizer</h4>
            </div>
            <Select value={activePreset} onValueChange={handlePresetChange}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flat">Flat</SelectItem>
                <SelectItem value="bass_boost">Bass Boost</SelectItem>
                <SelectItem value="acoustic">Acoustic</SelectItem>
                <SelectItem value="electronic">Electronic</SelectItem>
                <SelectItem value="vocal">Vocal Booster</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-surface-hover/30 p-2 rounded-md text-xs text-muted-foreground text-center">
            Note: Due to browser security policies (CORS) with the YouTube player, this equalizer is a visual UI demonstration only.
          </div>

          <div className="flex justify-between items-center h-40 px-2">
            {bandValues.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-3 h-full">
                <div className="text-[10px] text-muted-foreground font-medium">+{val}</div>
                <Slider
                  value={[val]}
                  min={-12}
                  max={12}
                  step={1}
                  orientation="vertical"
                  className="h-24 w-1.5"
                  onValueChange={(v) => handleBandChange(idx, v)}
                />
                <div className="text-[10px] text-muted-foreground font-medium">{BANDS[idx]}</div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
