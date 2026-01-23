
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import type { PlaylistItem } from '@shared/types';

export class PlaylistService {
  private dataPath: string;

  constructor() {
    this.dataPath = path.join(app.getPath('userData'), 'playlist.json');
  }

  save(playlist: PlaylistItem[]): void {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(playlist, null, 2));
    } catch (err) {
      console.error('Failed to save playlist:', err);
    }
  }

  load(): PlaylistItem[] {
    try {
      if (fs.existsSync(this.dataPath)) {
        const raw = fs.readFileSync(this.dataPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to load playlist:', err);
    }
    return [];
  }
}
