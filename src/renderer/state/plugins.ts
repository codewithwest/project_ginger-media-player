import { create } from 'zustand';
import { PluginUITab } from '../../shared/types/media';

interface PluginState {
  tabs: PluginUITab[];
  init: () => void;
}

export const usePluginStore = create<PluginState>((set) => ({
  tabs: [],
  init: async () => {
    // Initial fetch of registered tabs
    const tabs = await window.electronAPI.plugins.getUITabs();
    set({ tabs });

    // Listen for updates from Main process
    const cleanup = window.electronAPI.plugins.onUIUpdated((newTabs) => {
        set({ tabs: newTabs });
    });

    return cleanup;
  }
}));
