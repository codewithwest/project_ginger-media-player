import { create } from 'zustand';
import { GingerMediaProvider, MediaSource } from '../../shared/types/media';

interface ProviderState {
  providers: GingerMediaProvider[];
  init: () => void;
  browse: (providerId: string, path?: string) => Promise<MediaSource[]>;
  search: (query: string) => Promise<MediaSource[]>;
}

export const useProviderStore = create<ProviderState>((set) => ({
  providers: [],
  init: async () => {
    // Initial fetch of providers
    const providers = await window.electronAPI.plugins.getProviders();
    set({ providers });

    // Listen for updates
    const cleanup = window.electronAPI.plugins.onProvidersUpdated((newProviders) => {
        set({ providers: newProviders });
    });

    return cleanup;
  },
  browse: async (providerId, path) => {
      return await window.electronAPI.plugins.browseProvider(providerId, path);
  },
  search: async (query) => {
      return await window.electronAPI.plugins.searchProviders(query);
  }
}));
