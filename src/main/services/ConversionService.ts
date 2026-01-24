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

      // Sanitize output path
      const outputPath = path.resolve(request.outputPath.trim());
      const outputDir = path.dirname(outputPath);
      
      if (!fs.existsSync(outputDir)) {
          console.log(`[ConversionService] Creating directory: ${outputDir}`);
          fs.mkdirSync(outputDir, { recursive: true });
      }

      const command = ffmpeg(request.inputPath);

      // We only want audio for this extractor
      command.noVideo();
      command.toFormat(request.format);

      if (request.format === 'mp3') {
        command.audioCodec('libmp3lame');
        if (request.quality === 'high') command.audioBitrate('320k');
        else if (request.quality === 'low') command.audioBitrate('128k');
        else command.audioBitrate('192k');
      } else if (request.format === 'aac') {
        command.audioCodec('aac');
        if (request.quality === 'high') command.audioBitrate('256k');
        else if (request.quality === 'low') command.audioBitrate('96k');
        else command.audioBitrate('160k');
      } else if (request.format === 'flac') {
        command.audioCodec('flac');
      } else if (request.format === 'wav') {
        command.audioCodec('pcm_s16le'); // Standard WAV codec
      }

      command
        .outputOptions('-y')
        .on('progress', (progress: any) => {
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
        .on('error', (err: Error) => {
          this.activeCommands.delete(jobId);
          if (err.message.includes('SIGKILL')) {
            // Cancelled
            return;
          }
          console.error(`Conversion job ${jobId} failed:`, err);
          reject(err);
        })
        .save(outputPath);

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
