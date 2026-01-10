// Zustand store for media player state

import { create } from 'zustand';
import type { PlaybackState, MediaSource, MediaMetadata } from '@shared/types';

interface MediaPlayerStore extends PlaybackState {
  playlist: MediaSource[];
  currentIndex: number;
  
  // Actions
  setPlaybackState: (state: Partial<PlaybackState>) => void;
  setStreamUrl: (url: string) => void;
  setMetadata: (metadata: MediaMetadata) => void;
  
  play: (index?: number) => void;
  pause: () => void;
  stop: () => void;
  seek: (position: number) => void;
  setVolume: (volume: number) => void;
  next: () => void;
  previous: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  
  // Playlist Actions
  addToPlaylist: (item: MediaSource) => void;
  removeFromPlaylist: (index: number) => void;
  clearPlaylist: () => void;
  playAtIndex: (index: number) => void;
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
  playlist: [],
  currentIndex: -1,
  
  // Actions
  setPlaybackState: (newState) => set((state) => ({ ...state, ...newState })),
  setStreamUrl: (url) => set({ streamUrl: url }),
  setMetadata: (metadata) => set({ metadata }),
  
  play: (index?: number) => {
    const state = get();
    
    // If index provided, switch to that items
    if (typeof index === 'number') {
      get().playAtIndex(index);
      return;
    }
    
    // Just resume
    if (state.currentSource) {
      set({ status: 'playing' });
    } else if (state.playlist.length > 0) {
      // Start from beginning if nothing loaded but playlist has items
      get().playAtIndex(0);
    }
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
    const { playlist, currentIndex, repeat, shuffle } = get();
    if (playlist.length === 0) return;
    
    let nextIndex = currentIndex + 1;
    
    // Logic for shuffle/repeat...
    // Simplification: if shuffle is on, we should pick random, but for now linear shuffles
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } 
    
    if (nextIndex >= playlist.length) {
      if (repeat === 'all') {
        nextIndex = 0;
      } else {
        // Stop at end
        set({ status: 'stopped', position: 0 });
        return;
      }
    }
    
    get().playAtIndex(nextIndex);
  },
  
  previous: () => {
    const { playlist, currentIndex, position } = get();
    if (playlist.length === 0) return;
    
    // If we are more than 3 seconds in, restart track
    if (position > 3) {
      get().seek(0);
      return;
    }
    
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
       prevIndex = playlist.length - 1;
    }
    
    get().playAtIndex(prevIndex);
  },
  
  addToPlaylist: (item) => set((state) => ({ playlist: [...state.playlist, item] })),
  
  removeFromPlaylist: (index) => set((state) => {
    const newPlaylist = [...state.playlist];
    newPlaylist.splice(index, 1);
    // Adjust current index if needed...
    return { playlist: newPlaylist };
  }),
  
  clearPlaylist: () => set({ playlist: [], currentIndex: -1, currentSource: null, status: 'stopped' }),
  
  playAtIndex: async (index) => {
    const { playlist } = get();
    if (index < 0 || index >= playlist.length) return;
    
    const item = playlist[index];
    
    // Fetch stream URL for the new item
    // Note: We need to handle async here which might require updates to play action or separate effect
    // But since this is a store action, we can just do side effects? 
    // Ideally we invoke the electron API here
    
    try {
      const url = await window.electronAPI.media.getStreamUrl(item.path);
      const metadata = await window.electronAPI.media.getMetadata(item.path);
      
      set({
        currentSource: item,
        currentIndex: index,
        streamUrl: url,
        metadata: metadata,
        status: 'playing',
        position: 0,
        duration: metadata.duration || 0
      });
    } catch (err) {
      console.error("Failed to play item", err);
    }
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
