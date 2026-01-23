
// Main React application component
import { create } from 'zustand';
import type { PlaybackState, MediaSource, MediaMetadata, MediaPlayerState } from '../../shared/types/media';

interface MediaPlayerStore extends MediaPlayerState {
  playlist: MediaSource[];
  currentIndex: number;
  streamUrl?: string;
  metadata?: MediaMetadata;

  // Actions
  init: () => void;
  setPlaybackState: (state: Partial<PlaybackState>) => void;
  syncTime: (position: number, duration?: number) => void;

  // Commands to Main
  play: (index?: number) => void;
  pause: () => void;
  stop: () => void;
  seek: (position: number) => void;
  setVolume: (volume: number) => void;
  next: () => void;
  previous: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;

  loadPlaylist: () => Promise<void>;
  addToPlaylist: (item: MediaSource, playNow?: boolean) => void;
  removeFromPlaylist: (index: number) => void;
  clearPlaylist: () => void;
  playAtIndex: (index: number) => void;
}

export const useMediaPlayerStore = create<MediaPlayerStore>((set, get) => ({
  // Initial state (will be synced from Main)
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

  init: () => {
    // 1. Initial State Load
    window.electronAPI.media.getState().then(state => {
      set({ ...state });
      if (state.currentSource) {
        get().playAtIndex(state.currentIndex);
      }
    });

    // 2. Listen for changes from Main
    window.electronAPI.media.onStateChanged((newState) => {
      const oldSource = get().currentSource;
      set({ ...newState });

      // If the track changed, we need to get a new stream URL
      if (newState.currentSource && (!oldSource || oldSource.path !== newState.currentSource.path)) {
        get().playAtIndex(newState.currentIndex);
      }
    });
  },

  setPlaybackState: (newState) => set((state) => ({ ...state, ...newState })),

  syncTime: (position, duration) => {
    set({ position, duration });
    window.electronAPI.media.syncTime(position, duration);
  },

  play: (index) => window.electronAPI.media.play(index),
  pause: () => window.electronAPI.media.pause(),
  stop: () => window.electronAPI.media.stop(),

  seek: (position) => {
    set({ position });
    window.electronAPI.media.seek(position);
  },

  setVolume: (volume) => {
    set({ volume });
    window.electronAPI.media.setVolume(volume);
  },

  next: () => window.electronAPI.media.next(),
  previous: () => window.electronAPI.media.previous(),

  toggleShuffle: () => {
    const { shuffle } = get();
    window.electronAPI.media.setShuffle(!shuffle);
  },

  toggleRepeat: () => {
    const { repeat } = get();
    const modes = ['off', 'one', 'all'];
    const nextMode = modes[(modes.indexOf(repeat) + 1) % modes.length];
    window.electronAPI.media.setRepeat(nextMode);
  },

  loadPlaylist: async () => {
    const state = await window.electronAPI.media.getState();
    set({ playlist: state.playlist, currentIndex: state.currentIndex });
  },

  addToPlaylist: (item, playNow?: boolean) => {
    window.electronAPI.media.addToPlaylist(item, playNow);
  },

  removeFromPlaylist: () => {
    // TODO: Implement in PlaybackService
  },

  clearPlaylist: () => window.electronAPI.media.clearPlaylist(),

  playAtIndex: async (index) => {
    const { playlist } = get();
    if (index < 0 || index >= playlist.length) return;

    const item = playlist[index];
    try {
      const url = await window.electronAPI.media.getStreamUrl(item.path);
      const metadata = await window.electronAPI.media.getMetadata(item.path);

      set({
        currentSource: item,
        currentIndex: index,
        streamUrl: url,
        metadata: metadata,
        duration: metadata.duration || 0
      });

      // Only tell Main to play if we aren't already syncing from a play command
      // Actually, playAtIndex in renderer should just load the URL and then the <video> tag handles the rest.
    } catch (err) {
      console.error("[MediaPlayer] Failed to load at index", index, err);
    }
  },
}));
