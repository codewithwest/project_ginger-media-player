import { YtDlp, helpers } from 'ytdlp-nodejs';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { DownloadRequest, JobProgress } from '../../shared/types/media';

export class DownloadService {
  private ytdlp: YtDlp | null = null;
  private activeJobs: Map<string, { cancel: () => void }> = new Map();
  private binPath: string;

  constructor() {
    this.binPath = path.join(app.getPath('userData'), 'bin');
    if (!fs.existsSync(this.binPath)) {
      fs.mkdirSync(this.binPath, { recursive: true });
    }
  }

  getFFmpegPath(): string {
    const fileName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
    return path.join(this.binPath, fileName);
  }

  getFFprobePath(): string {
    const fileName = process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe';
    return path.join(this.binPath, fileName);
  }

  getYtDlpPath(): string {
    const fileName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
    return path.join(this.binPath, fileName);
  }

  async init(): Promise<void> {
    try {
      console.log('[DownloadService] Initializing with bin path:', this.binPath);

      const ffmpegFileName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
      const ytDlpFileName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';

      const ffmpegPath = path.join(this.binPath, ffmpegFileName);
      const ytDlpPath = path.join(this.binPath, ytDlpFileName);

      // 1. Check/Download yt-dlp first
      if (!fs.existsSync(ytDlpPath)) {
        console.log('[DownloadService] yt-dlp not found, downloading...');
        try {
          await helpers.downloadYtDlp(this.binPath);
          console.log('[DownloadService] yt-dlp download complete');
        } catch (err) {
          console.error('[DownloadService] Failed to download yt-dlp:', err);
        }
      }

      // 2. Check/Download ffmpeg
      if (!fs.existsSync(ffmpegPath)) {
        console.log('[DownloadService] ffmpeg not found, downloading...');
        try {
          await helpers.downloadFFmpeg(this.binPath);
          console.log('[DownloadService] ffmpeg download complete');
        } catch (err) {
          console.error('[DownloadService] Failed to download ffmpeg:', err);
        }
      }

      // 3. Now instantiate YtDlp if the main binary exists
      // We check existence again because download might have failed
      if (fs.existsSync(ytDlpPath)) {
        this.ytdlp = new YtDlp({
          binaryPath: ytDlpPath,
          ffmpegPath: fs.existsSync(ffmpegPath) ? ffmpegPath : undefined
        });
        console.log('[DownloadService] YtDlp initialized successfully.');
      } else {
        console.warn('[DownloadService] Initialized but YtDlp binary is still missing. Downloads will fail.');
      }
    } catch (error) {
      console.error('[DownloadService] Unexpected error during init:', error);
    }
  }

  private downloadQueue: Promise<void> = Promise.resolve();

  async start(
    jobId: string,
    request: DownloadRequest,
    onProgress: (progress: Partial<JobProgress>) => void
  ): Promise<void> {
    // Queue the download to ensure only one runs at a time
    this.downloadQueue = this.downloadQueue.then(async () => {
      if (!this.ytdlp) {
        await this.init();
      }

      onProgress({ status: 'running', progress: 0, message: 'Starting download...' });

      try {
        await this.ytdlp!.downloadAsync(request.url, {
          output: request.outputPath,
          // format can be a string or an object
          format: request.format === 'audio' ? 'bestaudio' : 'bestvideo+bestaudio/best',
          noPlaylist: true, // Crucial: ensure we don't download the whole playlist
          onProgress: (progress) => {
            onProgress({
              status: 'running',
              progress: progress.percentage,
              message: `Downloading: ${progress.percentage_str} (${progress.speed_str})`
            });
          }
        });

        onProgress({ status: 'completed', progress: 100, message: 'Download complete' });
      } catch (err: any) {
        if (err.message && err.message.includes('signal: SIGKILL')) {
          return;
        }
        console.error(`Download job ${jobId} failed:`, err);
        onProgress({ status: 'failed', message: err.message });
        throw err;
      } finally {
        this.activeJobs.delete(jobId);
      }
    });

    return this.downloadQueue;
  }

  cancel(jobId: string) {
    // TODO: Improvement - actually track the child process to kill it
    console.warn(`Cancellation requested for ${jobId}. Sequential queue might delay cancellation of pending jobs.`);
  }
}
