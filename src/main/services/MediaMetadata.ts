import ffmpeg from 'fluent-ffmpeg';
import { path as ffprobePath } from 'ffprobe-static';
import fs from 'fs';

export interface MediaMetadata {
  duration: number;
  format: string;
  bitrate: number;
  size: number;
  video?: {
    codec: string;
    width: number;
    height: number;
    fps: number;
  };
  audio?: {
    codec: string;
    channels: number;
    sampleRate: number;
  };
  tags?: Record<string, string>;
}

export class MediaMetadataService {
  constructor(ffprobePathCustom?: string) {
    if (ffprobePathCustom && fs.existsSync(ffprobePathCustom)) {
      ffmpeg.setFfprobePath(ffprobePathCustom);
      console.log('[MediaMetadata] Using custom ffprobe path:', ffprobePathCustom);
    } else if (ffprobePath) {
      ffmpeg.setFfprobePath(ffprobePath);
      console.log('[MediaMetadata] Falling back to default ffprobe path:', ffprobePath);
    } else {
      console.warn('[MediaMetadata] No ffprobe path found!');
    }
  }

  async getMetadata(filePath: string): Promise<MediaMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const format = metadata.format;
        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
        const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');

        const result: MediaMetadata = {
          duration: format.duration || 0,
          format: format.format_name || 'unknown',
          bitrate: format.bit_rate || 0,
          size: format.size || 0,
          tags: format.tags as Record<string, string>,
        };

        if (videoStream) {
          result.video = {
            codec: videoStream.codec_name || 'unknown',
            width: videoStream.width || 0,
            height: videoStream.height || 0,
            fps: this.parseFps(videoStream.r_frame_rate || '0/1'),
          };
        }

        if (audioStream) {
          result.audio = {
            codec: audioStream.codec_name || 'unknown',
            channels: audioStream.channels || 0,
            sampleRate: audioStream.sample_rate || 0,
          };
        }

        resolve(result);
      });
    });
  }

  private parseFps(fpsString: string): number {
    const parts = fpsString.split('/');
    if (parts.length === 2) {
      return parseInt(parts[0], 10) / parseInt(parts[1], 10);
    }
    return parseFloat(fpsString) || 0;
  }
}
