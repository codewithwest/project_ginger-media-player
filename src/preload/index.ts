// Preload script - Exposes safe IPC API to renderer via contextBridge

import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type {
  IpcRequest,
  IpcResponse,
  IpcEventData,
  PlaylistItem,
  MediaMetadata,
  MediaPlayerState,
  ConversionRequest,
  LibraryTrack,
  AppSettings,
  UpdateStatus,
  UpdateProgress,

  NetworkServer,
  MediaSource,
  SMBConfig,
  PluginUITab,
} from '@shared/types';

// Create type-safe API
const electronAPI = {
  // Media controls (backed by PlaybackService in Main)
  media: {
    play: (index?: number): Promise<void> =>
      ipcRenderer.invoke('playback:play', index),
    pause: (): Promise<void> =>
      ipcRenderer.invoke('playback:pause'),
    stop: (): Promise<void> =>
      ipcRenderer.invoke('playback:stop'),
    seek: (position: number): Promise<void> =>
      ipcRenderer.invoke('playback:seek', position),
    setVolume: (volume: number): Promise<void> =>
      ipcRenderer.invoke('playback:set-volume', volume),
    next: (): Promise<void> =>
      ipcRenderer.invoke('playback:next'),
    previous: (): Promise<void> =>
      ipcRenderer.invoke('playback:previous'),
    setShuffle: (shuffle: boolean): Promise<void> =>
      ipcRenderer.invoke('playback:set-shuffle', shuffle),
    setRepeat: (repeat: string): Promise<void> =>
      ipcRenderer.invoke('playback:set-repeat', repeat),
    setSpeed: (speed: number): Promise<void> =>
      ipcRenderer.invoke('playback:set-speed', speed),
    addToPlaylist: (item: PlaylistItem, playNow?: boolean): Promise<void> =>
      ipcRenderer.invoke('playback:add-to-playlist', { item, playNow }),
    clearPlaylist: (): Promise<void> =>
      ipcRenderer.invoke('playback:clear-playlist'),

    // Sync position from Renderer to Main
    syncTime: (position: number, duration?: number) =>
      ipcRenderer.send('playback:sync-time', { position, duration }),

    // Media Engine (Main process services)
    getStreamUrl: (filePath: string): Promise<string> =>
      ipcRenderer.invoke('media:get-stream-url', { filePath }),
    getMetadata: (filePath: string): Promise<MediaMetadata> =>
      ipcRenderer.invoke('media:get-metadata', { filePath }),
    getSubtitlesUrl: (filePath: string): Promise<string> =>
      ipcRenderer.invoke('media:get-subtitles-url', { filePath }),

    // Event listeners
    onStateChanged: (callback: (state: MediaPlayerState) => void) => {
      const subscription = (_event: IpcRendererEvent, data: MediaPlayerState) => callback(data);
      ipcRenderer.on('playback:state-changed', subscription);
      return () => { ipcRenderer.removeListener('playback:state-changed', subscription); };
    },
    getState: (): Promise<MediaPlayerState> => ipcRenderer.invoke('playback:get-state'),
    getResumePosition: (mediaId: string): Promise<number> => ipcRenderer.invoke('media:get-resume-position', { mediaId }),
  },

  // File operations
  file: {
    openDialog: () =>
      ipcRenderer.invoke('file:open-dialog'),
    addToPlaylist: (paths: string[]) =>
      ipcRenderer.invoke('file:add-to-playlist', { paths }),
    onFileOpenFromCLI: (callback: (path: string) => void) => {
      const subscription = (_event: IpcRendererEvent, path: string) => callback(path);
      ipcRenderer.on('file:open-from-cli', subscription);
      return () => { ipcRenderer.removeListener('file:open-from-cli', subscription); };
    },
    savePlaylist: (playlist: PlaylistItem[]) => ipcRenderer.invoke('playlist:save', { playlist }),
    loadPlaylist: () => ipcRenderer.invoke('playlist:load'),
  },

  // Job management
  jobs: {
    startConversion: (request: ConversionRequest) =>
      ipcRenderer.invoke('job:start-conversion', request),
    startDownload: (request: IpcRequest<'job:start-download'>): Promise<{ jobId: string }> =>
      ipcRenderer.invoke('job:start-download', request),
    cancel: (jobId: string): Promise<void> =>
      ipcRenderer.invoke('job:cancel', { jobId }),
    getAll: (): Promise<IpcResponse<'job:get-all'>> =>
      ipcRenderer.invoke('job:get-all'),
    clearHistory: (): Promise<void> =>
      ipcRenderer.invoke('job:clear-history'),

    onProgress: (callback: (data: IpcEventData<'job:progress'>) => void) => {
      const subscription = (_event: IpcRendererEvent, data: IpcEventData<'job:progress'>) => callback(data);
      ipcRenderer.on('job:progress', subscription);
      return () => { ipcRenderer.removeListener('job:progress', subscription); };
    },
  },

  // Downloads
  download: {
    getFormats: (url: string): Promise<IpcResponse<'download:get-formats'>> =>
      ipcRenderer.invoke('download:get-formats', { url }),
  },

  // Library
  library: {
    addFolder: (path: string): Promise<void> => ipcRenderer.invoke('library:add-folder', { path }),
    removeFolder: (path: string): Promise<void> => ipcRenderer.invoke('library:remove-folder', { path }),
    scan: (): Promise<LibraryTrack[]> => ipcRenderer.invoke('library:scan'),
    getAll: (): Promise<LibraryTrack[]> => ipcRenderer.invoke('library:get-all'),
    getFolders: (): Promise<string[]> => ipcRenderer.invoke('library:get-folders'),
    pickFolder: (): Promise<string | null> => ipcRenderer.invoke('library:pick-folder'),
  },

  // Window controls
  window: {
    minimize: (): Promise<void> =>
      ipcRenderer.invoke('window:minimize'),
    maximize: (): Promise<void> =>
      ipcRenderer.invoke('window:maximize'),
    close: (): Promise<void> =>
      ipcRenderer.invoke('window:close'),
    toggleFullScreen: (): Promise<void> =>
      ipcRenderer.invoke('window:toggle-full-screen'),
  },

  // Update
  update: {
    checkForUpdates: () => ipcRenderer.invoke('update:check'),
    downloadUpdate: () => ipcRenderer.invoke('update:download'),
    installUpdate: () => ipcRenderer.invoke('update:install'),
    onStatusChange: (callback: (data: UpdateStatus) => void) => {
      const subscription = (_event: IpcRendererEvent, data: UpdateStatus) => callback(data);
      ipcRenderer.on('update:status', subscription);
      return () => { ipcRenderer.removeListener('update:status', subscription); };
    },
    onProgress: (callback: (data: UpdateProgress) => void) => {
      const subscription = (_event: IpcRendererEvent, data: UpdateProgress) => callback(data);
      ipcRenderer.on('update:progress', subscription);
      return () => { ipcRenderer.removeListener('update:progress', subscription); };
    },
  },


  
  // Network
  network: {
    scanStart: (): Promise<void> => ipcRenderer.invoke('network:scan-start'),
    scanStop: (): Promise<void> => ipcRenderer.invoke('network:scan-stop'),
    getServers: (): Promise<NetworkServer[]> => ipcRenderer.invoke('network:get-servers'),
    browse: (server: NetworkServer, path?: string): Promise<MediaSource[]> => ipcRenderer.invoke('network:browse', { server, path }),
    connectSMB: (config: SMBConfig): Promise<void> => ipcRenderer.invoke('network:connect-smb', config),
    onServerFound: (callback: (server: NetworkServer) => void) => {
        const subscription = (_event: IpcRendererEvent, server: NetworkServer) => callback(server);
        ipcRenderer.on('network:server-found', subscription);
        return () => { ipcRenderer.removeListener('network:server-found', subscription); };
    },
  },



  // Plugins
  plugins: {
    getUITabs: (): Promise<PluginUITab[]> => ipcRenderer.invoke('plugins:get-ui-tabs'),
    onUIUpdated: (callback: (tabs: PluginUITab[]) => void) => {
        const subscription = (_event: IpcRendererEvent, tabs: PluginUITab[]) => callback(tabs);
        ipcRenderer.on('plugins:ui-updated', subscription);
        return () => { ipcRenderer.removeListener('plugins:ui-updated', subscription); };
    },
  },

  // Releases
  releases: {
    list: (): Promise<string[]> => ipcRenderer.invoke('releases:list'),
    getContent: (filename: string): Promise<string> => ipcRenderer.invoke('releases:content', filename),
  },

  // App Info
  app: {
    getDownloadsPath: (): Promise<string> => ipcRenderer.invoke('app:get-downloads-path'),
  },
  settings: {
    get: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
    update: (updates: Partial<AppSettings>): Promise<AppSettings> => ipcRenderer.invoke('settings:update', updates),
  },
};

// Expose API to renderer
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for window object
export type ElectronAPI = typeof electronAPI;
