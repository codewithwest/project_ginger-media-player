
import { ipcMain } from 'electron';
import fs from 'fs/promises';
import path from 'path';

export class ReleaseService {
  private docsPath: string;

  constructor() {
    // Determine path to docs based on environment
    // In dev: project_root/docs
    // In prod: resources/docs
    const isDev = !process.isPacked; 
    // process.isPacked is undefined usually? Electron uses helper.
    // Better check: process.resourcesPath contains 'resources' usually.
    // Or check if we are running in node via vite.
    
    // Standard electron check:
    const resourcesPath = process.resourcesPath;
    const appPath = process.cwd(); // In dev this is root.
    
    // In production, extraResource copies './docs' to 'resources/docs' (on mac/linux usually inside Contents or near executable).
    // On Linux: /usr/lib/app/resources/docs
    
    // Let's try finding it.
    this.docsPath = path.join(process.resourcesPath, 'docs'); // Prod
    
    // Fallback for dev
    if (process.env.NODE_ENV === 'development' || !this.checkExists(this.docsPath)) {
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
          const stat = require('fs').statSync(dir); // Sync check for init
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
