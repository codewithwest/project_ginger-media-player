// Type-safe IPC contract definitions
import type {
  PlaybackState,
  MediaSource,
  JobProgress,
  ConversionRequest,
  DownloadRequest,
  MediaFormat,
  MediaMetadata,
  Job,
} from './media';

export interface IpcContracts {
  // Playback controls
  'media:play': { request: { sourceId: string }; response: void };
  'media:pause': { request: void; response: void };
  'media:stop': { request: void; response: void };
  'media:seek': { request: { position: number }; response: void };
  'media:set-volume': { request: { volume: number }; response: void };
  'media:next': { request: void; response: void };
  'media:previous': { request: void; response: void };
  'media:toggle-shuffle': { request: void; response: void };
  'media:toggle-repeat': { request: void; response: void };

  // Media Engine
  'media:get-stream-url': { request: { filePath: string }; response: string };
  'media:get-metadata': { request: { filePath: string }; response: MediaMetadata };

  // Playback state (Main → Renderer events)
  'media:state-changed': { data: PlaybackState };
  'media:progress': { data: { position: number; duration: number } };

  // File operations
  'file:open-dialog': { request: void; response: string[] | null };
  'file:add-to-playlist': { request: { paths: string[] }; response: MediaSource[] };

  // Job management
  'job:start-conversion': { request: ConversionRequest; response: { jobId: string } };
  'job:start-download': { request: DownloadRequest; response: { jobId: string } };
  'job:cancel': { request: { jobId: string }; response: void };
  'job:get-all': { request: void; response: Job[] };
  'job:progress': { data: JobProgress };

  // Downloads
  'download:get-formats': { request: { url: string }; response: MediaFormat[] };

  // Window controls
  'window:minimize': { request: void; response: void };
  'window:maximize': { request: void; response: void };
  'window:close': { request: void; response: void };
}

// Helper type to extract request type
export type IpcRequest<T extends keyof IpcContracts> =
  IpcContracts[T] extends { request: infer R } ? R : never;

// Helper type to extract response type
export type IpcResponse<T extends keyof IpcContracts> =
  IpcContracts[T] extends { response: infer R } ? R : never;

// Helper type to extract event data type
export type IpcEventData<T extends keyof IpcContracts> =
  IpcContracts[T] extends { data: infer D } ? D : never;
