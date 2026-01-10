// Zustand store for media player state

import { create } from 'zustand';
import type { PlaybackState, MediaSource, MediaMetadata } from '@shared/types';

interface MediaPlayerStore extends PlaybackState {
  streamUrl?: string;
  metadata?: MediaMetadata;
  
  // Actions
  setPlaybackState: (state: Partial<PlaybackState>) => void;
  setStreamUrl: (url: string) => void;
  setMetadata: (metadata: MediaMetadata) => void;
  
  play: (sourceId?: string) => void;
  pause: () => void;
  stop: () => void;
  seek: (position: number) => void;
  setVolume: (volume: number) => void;
  next: () => void;
  previous: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}

export const useMediaPlayerStore = create<MediaPlayerStore>((set, get) => ({
  // Initial state
  status: 'stopped',
  currentSource: null,
  position: 0,
  duration: 0,
  volume: 1.0,
  shuffle: false,
  repeat: 'off',
  streamUrl: undefined,
  metadata: undefined,
  
  // Actions
  setPlaybackState: (newState) => set((state) => ({ ...state, ...newState })),
  setStreamUrl: (url) => set({ streamUrl: url }),
  setMetadata: (metadata) => set({ metadata }),
  
  play: (sourceId?: string) => {
    set({ status: 'playing' });
    // Local playback logic handled by VideoPlayer component via state subscription
  },
  
  pause: () => {
    set({ status: 'paused' });
  },
  
  stop: () => {
    set({ status: 'stopped', position: 0 });
  },
  
  seek: (position: number) => {
    set({ position });
  },
  
  setVolume: (volume: number) => {
    set({ volume });
  },
  
  next: () => {
    // TODO: Implement playlist logic
  },
  
  previous: () => {
    // TODO: Implement playlist logic
  },
  
  toggleShuffle: () => {
    set((state) => ({ shuffle: !state.shuffle }));
  },
  
  toggleRepeat: () => {
    set((state) => {
      const modes = ['off', 'one', 'all'] as const;
      const currentIndex = modes.indexOf(state.repeat);
      const nextIndex = (currentIndex + 1) % modes.length;
      return { repeat: modes[nextIndex] };
    });
  },
}));
