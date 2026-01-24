import ffmpeg from 'fluent-ffmpeg';
import pathToFfmpeg from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { ConversionRequest, JobProgress } from '../../shared/types/media';

export class ConversionService {
  private activeCommands: Map<string, ffmpeg.FfmpegCommand> = new Map();

  constructor(ffmpegPath?: string) {
    if (ffmpegPath && fs.existsSync(ffmpegPath)) {
      ffmpeg.setFfmpegPath(ffmpegPath);
      console.log('[ConversionService] Using custom ffmpeg path:', ffmpegPath);
    } else if (pathToFfmpeg) {
      ffmpeg.setFfmpegPath(pathToFfmpeg);
    }
  }

  async start(
    jobId: string,
    request: ConversionRequest,
    onProgress: (progress: Partial<JobProgress>) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      onProgress({ status: 'running', progress: 0, message: 'Starting conversion...' });

      // Ensure output directory exists
      const outputDir = path.dirname(request.outputPath);
      if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
      }

      const command = ffmpeg(request.inputPath);

      // Simple presets based on format and quality
      // TODO: Refine these presets
      if (request.format === 'mp3') {
        command.audioCodec('libmp3lame');
        if (request.quality === 'high') command.audioBitrate(320);
        else if (request.quality === 'low') command.audioBitrate(128);
        else command.audioBitrate(192);
      } else if (request.format === 'aac') {
        command.audioCodec('aac');
        if (request.quality === 'high') command.audioBitrate(256);
        else if (request.quality === 'low') command.audioBitrate(96);
        else command.audioBitrate(160);
      } else if (request.format === 'flac') {
        command.audioCodec('flac');
      } else if (request.format === 'wav') {
        command.format('wav');
      }

      command
        .on('progress', (progress) => {
          onProgress({
            progress: Math.round(progress.percent || 0),
            status: 'running',
            message: 'Converting...'
          });
        })
        .on('end', () => {
          this.activeCommands.delete(jobId);
          onProgress({ status: 'completed', progress: 100, message: 'Conversion complete' });
          resolve();
        })
        .on('error', (err) => {
          this.activeCommands.delete(jobId);
          if (err.message.includes('SIGKILL')) {
            // Cancelled
            return;
          }
          console.error(`Conversion job ${jobId} failed:`, err);
          reject(err);
        })
        .save(request.outputPath);

      this.activeCommands.set(jobId, command);
    });
  }

  cancel(jobId: string) {
    const command = this.activeCommands.get(jobId);
    if (command) {
      command.kill('SIGKILL');
      this.activeCommands.delete(jobId);
    }
  }
}
