import ffmpeg from 'fluent-ffmpeg';
import pathToFfmpeg from 'ffmpeg-static';
import { ConversionRequest, JobProgress } from '../../shared/types/media';

// Ensure ffmpeg binary is set
if (pathToFfmpeg) {
  ffmpeg.setFfmpegPath(pathToFfmpeg);
}

export class ConversionService {
  private activeCommands: Map<string, ffmpeg.FfmpegCommand> = new Map();

  async start(
    jobId: string, 
    request: ConversionRequest, 
    onProgress: (progress: Partial<JobProgress>) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      onProgress({ status: 'running', progress: 0, message: 'Starting conversion...' });

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
