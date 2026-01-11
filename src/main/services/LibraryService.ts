
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { MediaMetadataService, MediaMetadata } from './MediaMetadata';

export interface LibraryTrack {
  id: string; // uuid or path hash
  path: string;
  title: string;
  artist?: string;
  album?: string;
  duration: number;
  format: string;
  dateAdded: number;
  metadata?: MediaMetadata;
}

export interface LibraryData {
  folders: string[];
  tracks: LibraryTrack[];
}

export class LibraryService {
  private dataPath: string;
  private metadataService: MediaMetadataService;
  private data: LibraryData = { folders: [], tracks: [] };

  constructor() {
    this.dataPath = path.join(app.getPath('userData'), 'library.json');
    this.metadataService = new MediaMetadataService();
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const raw = fs.readFileSync(this.dataPath, 'utf-8');
        this.data = JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to load library:', err);
    }
  }

  private save() {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
    } catch (err) {
      console.error('Failed to save library:', err);
    }
  }

  getFolders(): string[] {
    return this.data.folders;
  }

  getTracks(): LibraryTrack[] {
    return this.data.tracks;
  }

  async addFolder(folderPath: string): Promise<void> {
    if (!this.data.folders.includes(folderPath)) {
      this.data.folders.push(folderPath);
      this.save();
      await this.scan(); // Scan immediately
    }
  }

  async removeFolder(folderPath: string): Promise<void> {
    this.data.folders = this.data.folders.filter(f => f !== folderPath);
    // Remove tracks belonging to this folder?
    // For now, let generic scan cleanup do it or just filter
    this.data.tracks = this.data.tracks.filter(t => !t.path.startsWith(folderPath));
    this.save();
  }

  async scan(): Promise<LibraryTrack[]> {
    console.log('Scanning library folders...', this.data.folders);
    const supportedExts = ['.mp3', '.mp4', '.mkv', '.webm', '.wav', '.flac', '.ogg', '.m4a', '.mov', '.avi'];
    const newTracks: LibraryTrack[] = [];

    // existing tracks map for quick lookup
    const existingMap = new Map(this.data.tracks.map(t => [t.path, t]));

    for (const folder of this.data.folders) {
      if (!fs.existsSync(folder)) continue;

      const files = await this.recursiveReaddir(folder);
      
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (supportedExts.includes(ext)) {
          // If already exists, skip or update?
          // Skip expensive metadata if size/mtime hasn't changed?
          // For now, check if path exists.
          if (existingMap.has(file)) {
            newTracks.push(existingMap.get(file)!);
            continue;
          }

          try {
            const metadata = await this.metadataService.getMetadata(file);
            const stats = fs.statSync(file);

            const track: LibraryTrack = {
              id: this.generateId(file),
              path: file,
              title: metadata.tags?.title || path.basename(file, ext),
              artist: metadata.tags?.artist || 'Unknown Artist',
              album: metadata.tags?.album || 'Unknown Album',
              duration: metadata.duration,
              format: metadata.format,
              dateAdded: Date.now(),
              metadata
            };

            newTracks.push(track);
          } catch (err) {
            console.warn(`Failed to process file ${file}:`, err);
          }
        }
      }
    }

    this.data.tracks = newTracks;
    this.save();
    return newTracks;
  }

  private async recursiveReaddir(dir: string): Promise<string[]> {
    const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? this.recursiveReaddir(res) : res;
    }));
    return Array.prototype.concat(...files);
  }

  private generateId(filePath: string): string {
    // Simple hash replacement
    return Buffer.from(filePath).toString('base64');
  }
}
