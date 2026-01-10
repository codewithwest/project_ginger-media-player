// Global type definitions for window object

import type { ElectronAPI } from '../preload/index';
import type { MediaMetadata } from '../shared/types/media';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
