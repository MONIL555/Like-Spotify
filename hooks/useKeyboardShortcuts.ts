import { useEffect } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { useQueueStore } from '@/store/queueStore';

export function useKeyboardShortcuts() {
  const { togglePlay, setVolume, volume, currentTrack, setCurrentTrack, advanceToNext } = usePlayerStore();
  const { playPrevious } = useQueueStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'KeyM':
          e.preventDefault();
          setVolume(volume === 0 ? 50 : 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          advanceToNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          const prevTrack = playPrevious();
          if (prevTrack) setCurrentTrack(prevTrack);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(100, volume + 10));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 10));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, setVolume, volume, playPrevious, currentTrack, setCurrentTrack, advanceToNext]);
}
