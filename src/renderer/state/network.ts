import { create } from 'zustand';
import { NetworkServer, MediaSource, SMBConfig } from '../../shared/types/media';

interface NetworkState {
  servers: NetworkServer[];
  isScanning: boolean;
  currentServer: NetworkServer | null;
  currentPath: string;
  contents: MediaSource[];
  isLoading: boolean;
  error: string | null;

  // Actions
  startScan: () => Promise<void>;
  stopScan: () => Promise<void>;
  browse: (server: NetworkServer, path?: string) => Promise<void>;
  connectSMB: (config: SMBConfig) => Promise<void>;
  setServers: (servers: NetworkServer[]) => void;
  reset: () => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  servers: [],
  isScanning: false,
  currentServer: null,
  currentPath: '',
  contents: [],
  isLoading: false,
  error: null,

  startScan: async () => {
    set({ isScanning: true, error: null });
    try {
      await window.electronAPI.network.scanStart();
      // Listeners should handle 'server-found' and update list via separate mechanism 
      // or we poll? 
      // We set up listener in App.tsx or use a specialized hook.
      // But we can also get initial list.
      const servers = await window.electronAPI.network.getServers();
      set({ servers });
    } catch (e) {
      set({ error: 'Failed to start scan', isScanning: false });
    }
  },

  stopScan: async () => {
    await window.electronAPI.network.scanStop();
    set({ isScanning: false });
  },

  browse: async (server, path = '0') => {
    set({ isLoading: true, error: null, currentServer: server, currentPath: path });
    try {
      const contents = await window.electronAPI.network.browse(server, path);
      set({ contents, isLoading: false });
    } catch (e) {
      console.error(e);
      set({ error: 'Failed to browse', isLoading: false });
    }
  },

  connectSMB: async (config) => {
    set({ isLoading: true, error: null });
    try {
      await window.electronAPI.network.connectSMB(config);
      // After connect, we can add a "dummy" server entry representing this connection?
      // Or the user should refresh servers?
      // NetworkManager usually adds it to servers list? 
      // For now, assume we handle it manually.
      set({ isLoading: false });
    } catch (e) {
      set({ error: 'Failed to connect SMB', isLoading: false });
    }
  },

  setServers: (servers) => set({ servers }),
  
  reset: () => set({ currentServer: null, currentPath: '', contents: [], error: null })
}));
