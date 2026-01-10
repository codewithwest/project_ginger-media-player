// Zustand store for media player state

import { create } from 'zustand';
import type { PlaybackState, MediaSource } from '@shared/types';

interface MediaPlayerStore extends PlaybackState {
  // Actions
  setPlaybackState: (state: Partial<PlaybackState>) => void;
  play: (sourceId: string) => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  toggleShuffle: () => Promise<void>;
  toggleRepeat: () => Promise<void>;
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
  
  // Actions
  setPlaybackState: (newState) => set((state) => ({ ...state, ...newState })),
  
  play: async (sourceId: string) => {
    await window.electronAPI.media.play(sourceId);
  },
  
  pause: async () => {
    await window.electronAPI.media.pause();
  },
  
  stop: async () => {
    await window.electronAPI.media.stop();
  },
  
  seek: async (position: number) => {
    await window.electronAPI.media.seek(position);
  },
  
  setVolume: async (volume: number) => {
    await window.electronAPI.media.setVolume(volume);
    set({ volume });
  },
  
  next: async () => {
    await window.electronAPI.media.next();
  },
  
  previous: async () => {
    await window.electronAPI.media.previous();
  },
  
  toggleShuffle: async () => {
    await window.electronAPI.media.toggleShuffle();
  },
  
  toggleRepeat: async () => {
    await window.electronAPI.media.toggleRepeat();
  },
}));
