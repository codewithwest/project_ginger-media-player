import express from 'express';
import getPort from 'get-port';
import cors from 'cors';
import { Server } from 'http';
import fs from 'fs';
import { TranscoderService } from './Transcoder';
import { MediaMetadataService } from './MediaMetadata';

export class MediaServer {
  private app: express.Express;
  private server: Server | null = null;
  private port = 0;
  private transcoder: TranscoderService;
  private metadataService: MediaMetadataService;

  constructor(ffmpegPath?: string, ffprobePath?: string) {
    this.app = express();
    this.transcoder = new TranscoderService(ffmpegPath);
    this.metadataService = new MediaMetadataService(ffprobePath);

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(cors());
    // Basic request logging
    this.app.use((req, res, next) => {
      console.log(`[MediaServer] ${req.method} ${req.url}`);
      next();
    });
  }

  private setupRoutes() {
    // 1. Direct File Serving (for supported formats)
    // Use this endpoint for files we know the browser can play directly (MP4, WebM, MP3)
    this.app.get('/file', (req, res) => {
      const filePath = req.query.path as string;
      if (!filePath) {
        console.error('[MediaServer] No path provided for /file');
        res.status(400).send('Path is required');
        return;
      }

      if (!fs.existsSync(filePath)) {
        console.error(`[MediaServer] File not found: ${filePath}`);
        res.status(404).send('File not found');
        return;
      }

      res.sendFile(filePath, (err) => {
        if (err) {
          console.error(`[MediaServer] Error sending file: ${filePath}`, err);
          if (!res.headersSent) {
            res.status(500).send('Error sending file');
          }
        }
      });
    });

    // 2. Transcoded Stream
    // Use this for MKV, AVI, etc. Or if we just want uniform MP4 output.
    this.app.get('/stream', (req, res) => {
      const filePath = req.query.path as string;
      const startTime = parseFloat(req.query.start as string) || 0;

      if (!filePath) {
        console.error('[MediaServer] No path provided for /stream');
        res.status(400).send('Path is required');
        return;
      }

      if (!fs.existsSync(filePath)) {
        console.error(`[MediaServer] File not found for stream: ${filePath}`);
        res.status(404).send('File not found');
        return;
      }

      console.log(`[MediaServer] Starting stream for: ${filePath} at ${startTime}s`);

      // Set proper headers for streaming
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Transfer-Encoding', 'chunked');

      // Create ffmpeg command
      const command = this.transcoder.createStream(filePath, startTime);

      // Pipe output to response
      command.pipe(res, { end: true });

      // Handle client disconnect
      req.on('close', () => {
        console.log('[MediaServer] Client closed connection, killing ffmpeg...');
        command.kill('SIGKILL');
      });
    });

    // 3. Metadata
    this.app.get('/metadata', async (req, res) => {
      const filePath = req.query.path as string;
      try {
        const metadata = await this.metadataService.getMetadata(filePath);
        res.json(metadata);
      } catch (error) {
        console.error('Metadata error:', error);
        res.status(500).json({ error: 'Failed to get metadata' });
      }
    });

    // 4. Subtitles (VTT extraction)
    this.app.get('/subtitles', (req, res) => {
      const filePath = req.query.path as string;

      if (!filePath || !fs.existsSync(filePath)) {
        res.status(404).send('File not found');
        return;
      }

      console.log(`[MediaServer] Extracting subtitles for: ${filePath}`);

      res.setHeader('Content-Type', 'text/vtt');

      const command = this.transcoder.extractSubtitles(filePath);

      command.pipe(res, { end: true });

      req.on('close', () => {
        command.kill('SIGKILL');
      });
    });
  }

  async start(): Promise<string> {
    this.port = await getPort({ port: 3000 });

    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, '127.0.0.1', () => {
        const url = `http://127.0.0.1:${this.port}`;
        console.log(`[MediaServer] Running at ${url}`);
        resolve(url);
      });
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  getUrl(): string {
    return `http://127.0.0.1:${this.port}`;
  }

  async getMetadata(filePath: string) {
    return this.metadataService.getMetadata(filePath);
  }
}
