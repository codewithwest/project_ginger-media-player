// Shared TypeScript types for IPC communication

export type PlaybackStatus = 'stopped' | 'playing' | 'paused' | 'buffering';

export type RepeatMode = 'off' | 'one' | 'all';

export interface MediaSource {
  id: string;
  type: 'local' | 'remote';
  path: string;
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
}

export interface PlaybackState {
  status: PlaybackStatus;
  currentSource: MediaSource | null;
  position: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
}

export interface JobProgress {
  jobId: string;
  type: 'conversion' | 'download';
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  message?: string;
}

export interface ConversionRequest {
  inputPath: string;
  outputPath: string;
  format: 'mp3' | 'flac' | 'wav' | 'aac';
  quality?: 'low' | 'medium' | 'high';
}

export interface DownloadRequest {
  url: string;
  outputPath: string;
  format: 'best' | 'audio' | 'video';
  quality?: string;
}

export interface MediaFormat {
  formatId: string;
  ext: string;
  resolution?: string;
  filesize?: number;
  vcodec?: string;
  acodec?: string;
}
