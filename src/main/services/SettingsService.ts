import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { Job } from '../../shared/types/media';

interface AppSettings {
   downloadsPath: string;
}

interface StoreData {
   settings: AppSettings;
   jobHistory: Job[];
   playbackPositions: Record<string, number>;
}

export class SettingsService {
   private filePath: string;
   private data: StoreData;

   constructor() {
      const userDataPath = app.getPath('userData');
      this.filePath = path.join(userDataPath, 'settings.json');
      this.data = this.loadData();
   }

   private loadData(): StoreData {
      try {
         if (fs.existsSync(this.filePath)) {
            const content = fs.readFileSync(this.filePath, 'utf-8');
            return JSON.parse(content);
         }
      } catch (error) {
         console.error('[SettingsService] Failed to load settings:', error);
      }

      // Default data
      return {
         settings: {
            downloadsPath: path.join(app.getPath('videos'), 'GingerPlayer')
         },
         jobHistory: [],
         playbackPositions: {}
      };
   }

   private saveData() {
      try {
         fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
      } catch (error) {
         console.error('[SettingsService] Failed to save settings:', error);
      }
   }

   getSettings(): AppSettings {
      return this.data.settings;
   }

   updateSettings(updates: Partial<AppSettings>) {
      this.data.settings = { ...this.data.settings, ...updates };
      this.saveData();
   }

   getJobHistory(): Job[] {
      return this.data.jobHistory;
   }

   saveJob(job: Job) {
      const index = this.data.jobHistory.findIndex(j => j.jobId === job.jobId);
      if (index !== -1) {
         this.data.jobHistory[index] = job;
      } else {
         this.data.jobHistory.push(job);
      }
      // Keep only last 50 jobs to prevent file bloat
      if (this.data.jobHistory.length > 50) {
         this.data.jobHistory = this.data.jobHistory
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 50);
      }
      this.saveData();
   }

   clearHistory() {
      this.data.jobHistory = [];
      this.saveData();
   }

   savePlaybackPosition(mediaId: string, position: number) {
      this.data.playbackPositions[mediaId] = position;
      // We don't save to disk on every single sync-time to avoid IO overhead.
      // But we should save it eventually.
      // Actually settings.json is small, but maybe only save every 10 secs?
      // For now, let's just save.
      this.saveData();
   }

   getPlaybackPosition(mediaId: string): number {
      return this.data.playbackPositions[mediaId] || 0;
   }
}
