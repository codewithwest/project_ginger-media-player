
import { autoUpdater } from 'electron-updater';
import log from 'electron-log/main';
import { BrowserWindow } from 'electron';
import type { Logger } from 'electron-log';

export class UpdateService {
  constructor(private mainWindow: BrowserWindow) {
    log.initialize();
    autoUpdater.logger = log;
    (autoUpdater.logger as Logger).transports.file.level = 'info';

    // Disable auto-download to give user control, or enable if preferred.
    // Let's enable auto-download for seamless experience but notify user.
    autoUpdater.autoDownload = true;

    this.initListeners();
  }

  private initListeners() {
    autoUpdater.on('checking-for-update', () => {
      this.send('update:status', { status: 'checking' });
    });

    autoUpdater.on('update-available', (info) => {
      this.send('update:status', { status: 'available', info });
    });

    autoUpdater.on('update-not-available', (info) => {
      this.send('update:status', { status: 'not-available', info });
    });

    autoUpdater.on('error', (err) => {
      this.send('update:status', { status: 'error', error: err.message });
    });

    autoUpdater.on('download-progress', (progressObj) => {
      this.send('update:progress', progressObj);
    });

    autoUpdater.on('update-downloaded', (info) => {
      this.send('update:status', { status: 'downloaded', info });
    });
  }

  public checkForUpdates() {
    // Check for updates
    // For local dev, checking might error or do nothing without valid setup,
    // but electron-updater usually handles dev mode gracefully (skips or mocks).
    // To force dev check:
    // Object.defineProperty(app, 'isPackaged', { get: () => true }); // Hacky
    // Better to just let it run.
    autoUpdater.checkForUpdates().catch(err => {
      console.error('Failed to check for updates:', err);
      this.send('update:status', { status: 'error', error: err.message });
    });
  }

  public downloadUpdate() {
    autoUpdater.downloadUpdate();
  }

  public quitAndInstall() {
    autoUpdater.quitAndInstall();
  }

  private send(channel: string, ...args: unknown[]): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, ...args);
    }
  }
}
