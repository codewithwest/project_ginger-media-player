
import { ipcMain, app } from 'electron';
import fs from 'fs/promises';
import { statSync } from 'fs';
import path from 'path';

export class ReleaseService {
  private docsPath: string;

  constructor() {
    // Determine path to docs based on environment
    // In dev: project_root/docs
    // In prod: resources/docs
    const isDev = !app.isPackaged;
    const appPath = process.cwd(); 
    
    // Let's try finding it.
    this.docsPath = path.join(process.resourcesPath, 'docs'); // Prod
    
    // Fallback for dev
    if (isDev || !this.checkExists(this.docsPath)) {
        this.docsPath = path.resolve(appPath, 'docs');
    }

    this.init();
  }

  private init() {
    ipcMain.handle('releases:list', async () => {
      return this.getReleases();
    });

    ipcMain.handle('releases:content', async (_, filename: string) => {
      return this.getContent(filename);
    });
  }

  private checkExists(dir: string): boolean {
      try {
          const stat = statSync(dir); // Sync check for init
          return stat.isDirectory();
      } catch {
          return false;
      }
  }

  private async getReleases() {
    try {
      const releaseDir = path.join(this.docsPath, 'release');
      const entries = await fs.readdir(releaseDir);
      
      // Filter for md files
      const releaseFiles = entries.filter(f => f.endsWith('.md'));
      
      // Sort: Try to parse version?
      // Filename format: RELEASE_NOTES_#0.md
      // We can sort by string desc or try to parse number.
      // Let's return list so renderer can sort or display.
      return releaseFiles.sort().reverse(); 
    } catch (e) {
      console.error('Failed to read releases:', e);
      return [];
    }
  }

  private async getContent(filename: string) {
    try {
      const filePath = path.join(this.docsPath, 'release', filename);
      // Security check: ensure filePath is inside releaseDir
      const releaseDir = path.join(this.docsPath, 'release');
      if (!filePath.startsWith(releaseDir)) {
          throw new Error('Invalid path');
      }
      
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (e) {
       console.error('Failed to read release content:', e);
       return '';
    }
  }
}
