import { create } from 'zustand';
import { PluginUITab } from '../../shared/types/media';

interface PluginState {
  tabs: PluginUITab[];
  plugins: any[];
  init: () => void;
  updateSetting: (pluginName: string, key: string, value: any) => Promise<void>;
}

export const usePluginStore = create<PluginState>((set) => ({
  tabs: [],
  plugins: [],
  init: async () => {
    // 1. Initial State Load
    const tabs = await window.electronAPI.plugins.getUITabs();
    const allPlugins = await window.electronAPI.plugins.getAll();
    set({ tabs, plugins: allPlugins });

    // 2. Listen for updates
    const cleanTabs = window.electronAPI.plugins.onUIUpdated((newTabs) => {
      set({ tabs: newTabs });
    });

    const cleanPlugins = window.electronAPI.plugins.onUpdated((newPlugins) => {
        set({ plugins: newPlugins });
    });

    return () => {
        cleanTabs();
        cleanPlugins();
    };
  },
  updateSetting: async (pluginName, key, value) => {
      await window.electronAPI.plugins.updateSetting(pluginName, key, value);
  }
}));

