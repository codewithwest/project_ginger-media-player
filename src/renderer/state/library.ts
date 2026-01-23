
import { create } from 'zustand';

import type { LibraryTrack } from '../../shared/types/app';

interface LibraryStore {
  folders: string[];
  tracks: LibraryTrack[];
  isLoading: boolean;
  
  loadLibrary: () => Promise<void>;
  addFolder: () => Promise<void>; // Triggers dialog in main
  removeFolder: (path: string) => Promise<void>;
  scanLibrary: () => Promise<void>;
}

export const useLibraryStore = create<LibraryStore>((set) => ({
  folders: [],
  tracks: [],
  isLoading: false,

  loadLibrary: async () => {
    set({ isLoading: true });
    try {
      const folders = await window.electronAPI.library.getFolders();
      const tracks = await window.electronAPI.library.getAll();
      set({ folders, tracks, isLoading: false });
    } catch (err) {
      console.error('Failed to load library:', err);
      set({ isLoading: false });
    }
  },

  addFolder: async () => {
    try {
      const folderPath = await window.electronAPI.library.pickFolder();
      if (!folderPath) return;

      set({ isLoading: true });
      // Add folder to backend (this will trigger scan too)
      await window.electronAPI.library.addFolder(folderPath);
      
      // Refresh local state
      const folders = await window.electronAPI.library.getFolders();
      const tracks = await window.electronAPI.library.getAll();
      set({ folders, tracks, isLoading: false });
    } catch (err) {
      console.error('Failed to add folder:', err);
      set({ isLoading: false });
    }
  },

  removeFolder: async (path: string) => {
      const tracks = await window.electronAPI.library.removeFolder(path);
      // Update folders list locally too?
      const folders = await window.electronAPI.library.getFolders();
      set({ folders, tracks });
  },

  scanLibrary: async () => {
    set({ isLoading: true });
    try {
      const tracks = await window.electronAPI.library.scan();
      set({ tracks, isLoading: false });
    } catch (err) {
      console.error('Failed to scan library:', err);
      set({ isLoading: false });
    }
  }
}));
