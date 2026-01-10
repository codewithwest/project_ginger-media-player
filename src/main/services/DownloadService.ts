import { DownloadRequest, JobProgress } from '../../shared/types/media';
// Use require to ensure proper CJS/ESM interop in Electron Main
const exec = require('youtube-dl-exec');

export class DownloadService {
  private activeDownloads: Map<string, any> = new Map();

  async start(
    jobId: string, 
    request: DownloadRequest, 
    onProgress: (progress: Partial<JobProgress>) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      onProgress({ status: 'running', progress: 0, message: 'Starting download...' });
      
      const subprocess = exec(request.url, {
        output: request.outputPath,
        format: request.format === 'audio' ? 'bestaudio' : 'bestvideo+bestaudio/best',
        // Add progress flags
        newline: true,
      });

      // Access childProcess on the promise (execa v5+)
      // If using 'youtube-dl-exec', it typically returns an execa Promise.
      // Sometimes we need to cast or access it differently.
      const process = subprocess.childProcess || subprocess;
      
      this.activeDownloads.set(jobId, process);

      // Try to attach listener to stdout for progress
      const stdout = process.stdout;
      if (stdout) {
          stdout.on('data', (data: Buffer) => {
          const text = data.toString();
          // Parse progress from yt-dlp output
          const match = text.match(/\[download\]\s+(\d+\.?\d*)%/);
          if (match) {
            const percent = parseFloat(match[1]);
            onProgress({ 
              status: 'running', 
              progress: percent, 
              message: `Downloading: ${percent}%` 
            });
          }
        });
      } else {
        console.warn('No stdout stream available for progress tracking');
        onProgress({ status: 'running', progress: -1, message: 'Downloading (no progress)...' });
      }

      const stderr = process.stderr;
      if (stderr) {
        stderr.on('data', (data: Buffer) => {
          // Only log errors, or maybe non-progress info is here?
          // yt-dlp might output progress to stderr?
          const text = data.toString();
           // Sometimes progress is on stderr for some tools
           const match = text.match(/\[download\]\s+(\d+\.?\d*)%/);
           if (match) {
             const percent = parseFloat(match[1]);
             onProgress({ 
               status: 'running', 
               progress: percent, 
               message: `Downloading: ${percent}%` 
             });
           } else {
             // console.error(`yt-dlp stderr: ${data}`); 
           }
        });
      }


      subprocess
        .then(() => {
          this.activeDownloads.delete(jobId);
          onProgress({ status: 'completed', progress: 100, message: 'Download complete' });
          resolve();
        })
        .catch((err: any) => {
          this.activeDownloads.delete(jobId);
          // Check if cancelled
          if (err.killed) {
             // Already handled by cancellation logic usually? or we resolve?
             return; 
          }
          console.error(`Download job ${jobId} failed:`, err);
          onProgress({ status: 'failed', message: err.message });
          reject(err);
        });
    });
  }

  cancel(jobId: string) {
    const process = this.activeDownloads.get(jobId);
    if (process) {
      console.log('Cancelling download process:', process);
      try {
        if (typeof process.kill === 'function') {
          process.kill('SIGKILL');
        } else if (typeof process.cancel === 'function') {
          process.cancel();
        } else {
          console.warn(`Could not cancel job ${jobId}: process object has no kill/cancel method`);
        }
      } catch (err) {
        console.error(`Error cancelling job ${jobId}:`, err);
      }
      this.activeDownloads.delete(jobId);
    }
  }
}
