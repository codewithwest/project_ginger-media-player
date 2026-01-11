// Preload script - Exposes safe IPC API to renderer via contextBridge

import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type { IpcContracts, IpcRequest, IpcResponse, IpcEventData } from '@shared/types';

// Create type-safe API
const electronAPI = {
  // Media controls
  media: {
    play: (sourceId: string): Promise<void> => 
      ipcRenderer.invoke('media:play', { sourceId }),
    pause: (): Promise<void> => 
      ipcRenderer.invoke('media:pause'),
    stop: (): Promise<void> => 
      ipcRenderer.invoke('media:stop'),
    seek: (position: number): Promise<void> => 
      ipcRenderer.invoke('media:seek', { position }),
    setVolume: (volume: number): Promise<void> => 
      ipcRenderer.invoke('media:set-volume', { volume }),
    next: (): Promise<void> => 
      ipcRenderer.invoke('media:next'),
    previous: (): Promise<void> => 
      ipcRenderer.invoke('media:previous'),
    toggleShuffle: (): Promise<void> => 
      ipcRenderer.invoke('media:toggle-shuffle'),
    toggleRepeat: (): Promise<void> => 
      ipcRenderer.invoke('media:toggle-repeat'),

    // Media Engine
    getStreamUrl: (filePath: string): Promise<string> => 
      ipcRenderer.invoke('media:get-stream-url', { filePath }),
    getMetadata: (filePath: string): Promise<any> => 
      ipcRenderer.invoke('media:get-metadata', { filePath }),
    getSubtitlesUrl: (filePath: string): Promise<string> => 
      ipcRenderer.invoke('media:get-subtitles-url', { filePath }),
    
    // Event listeners
    onStateChanged: (callback: (state: IpcEventData<'media:state-changed'>) => void) => {
      const subscription = (_event: IpcRendererEvent, data: IpcEventData<'media:state-changed'>) => callback(data);
      ipcRenderer.on('media:state-changed', subscription);
      return () => ipcRenderer.removeListener('media:state-changed', subscription);
    },
    onProgress: (callback: (data: IpcEventData<'media:progress'>) => void) => {
      const subscription = (_event: IpcRendererEvent, data: IpcEventData<'media:progress'>) => callback(data);
      ipcRenderer.on('media:progress', subscription);
      return () => ipcRenderer.removeListener('media:progress', subscription);
    },
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
      return () => ipcRenderer.removeListener('file:open-from-cli', subscription);
    },
  },
  
  // Job management
  jobs: {
    startConversion: (request: any) => 
      ipcRenderer.invoke('job:start-conversion', request),
    startDownload: (request: IpcRequest<'job:start-download'>): Promise<{ jobId: string }> => 
      ipcRenderer.invoke('job:start-download', request),
    cancel: (jobId: string): Promise<void> => 
      ipcRenderer.invoke('job:cancel', { jobId }),
    getAll: (): Promise<IpcResponse<'job:get-all'>> => 
      ipcRenderer.invoke('job:get-all'),
    
    onProgress: (callback: (data: IpcEventData<'job:progress'>) => void) => {
      const subscription = (_event: IpcRendererEvent, data: IpcEventData<'job:progress'>) => callback(data);
      ipcRenderer.on('job:progress', subscription);
      return () => ipcRenderer.removeListener('job:progress', subscription);
    },
  },
  
  // Downloads
  download: {
    getFormats: (url: string): Promise<IpcResponse<'download:get-formats'>> => 
      ipcRenderer.invoke('download:get-formats', { url }),
  },
  
  // Library
  library: {
    addFolder: (path: string): Promise<any> => ipcRenderer.invoke('library:add-folder', { path }),
    removeFolder: (path: string): Promise<any> => ipcRenderer.invoke('library:remove-folder', { path }),
    scan: (): Promise<any> => ipcRenderer.invoke('library:scan'),
    getAll: (): Promise<any[]> => ipcRenderer.invoke('library:get-all'),
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
  },
};

// Expose API to renderer
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for window object
export type ElectronAPI = typeof electronAPI;
