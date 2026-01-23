
import { app, BrowserWindow, ipcMain, dialog, globalShortcut } from 'electron';
import path from 'path';
import { MediaServer } from './services/MediaServer';
import { TrayService } from './services/TrayService';
import { JobManager } from './services/JobManager';
import { ConversionService } from './services/ConversionService';
import { DownloadService } from './services/DownloadService';
import { LibraryService } from './services/LibraryService';
import { PlaylistService } from './services/PlaylistService';
import { UpdateService } from './services/UpdateService';
import { ReleaseService } from './services/ReleaseService';
import { SettingsService } from './services/SettingsService';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();

let mainWindow: BrowserWindow | null = null;
let mediaServer: MediaServer | null = null;
let downloadService: DownloadService | null = null;
let trayService: TrayService | null = null;
let libraryService: LibraryService | null = null;
let playlistService: PlaylistService | null = null;
let updateService: UpdateService | null = null;
let settingsService: SettingsService | null = null;

function handleCommandLineArgs(argv: string[]) {
  const args = argv.slice(app.isPackaged ? 1 : 2);
  const filePath = args.find(arg => !arg.startsWith('-'));

  if (filePath && mainWindow) {
    console.log('Opening file from CLI:', filePath);
    mainWindow.webContents.send('file:open-from-cli', filePath);
  }
}

const createWindow = (): void => {
  console.log('[Main] Creating window...');

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: true, // Force show on creation to debug Linux visibility
    backgroundColor: '#0a0a0a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hidden',
  });

  // Log loading failures
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Main] Failed to load UI: ${errorCode} ${errorDescription} at ${validatedURL}`);
  });

  // Load the index.html of the app
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    console.log('[Main] Loading Dev Server URL:', MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    const indexPath = path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);
    console.log('[Main] Loading File:', indexPath);
    mainWindow.loadFile(indexPath);
  }

  // Ready to show
  mainWindow.once('ready-to-show', () => {
    console.log('[Main] Window ready to show.');
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Force show after a delay just in case ready-to-show never fires on this Linux distro
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.log('[Main] Fallback: Force showing window.');
      mainWindow.show();
    }
  }, 5000);

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window close - keep app running for background playback
  mainWindow.on('close', (event) => {
    if (!(app as any).isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
      console.log('[Main] Window hidden (background mode)');
    }
    return false;
  });

  // Initialize Tray Service
  trayService = new TrayService(mainWindow);
  trayService.createTray();
};

async function registerIpcHandlers(): Promise<void> {
  // Initialize Services
  settingsService = new SettingsService();
  const jobManager = new JobManager(mainWindow!, settingsService);
  const ffmpegPath = downloadService?.getFFmpegPath();
  const ffprobePath = downloadService?.getFFprobePath();

  const conversionService = new ConversionService(ffmpegPath);
  // downloadService is now initialized in app.on('ready')
  libraryService = new LibraryService(ffprobePath);
  playlistService = new PlaylistService();
  updateService = new UpdateService(mainWindow!);
  new ReleaseService();

  jobManager.registerService('conversion', conversionService);
  if (downloadService) {
    jobManager.registerService('download', downloadService);
  }

  // Playlist Persistence
  ipcMain.handle('playlist:save', async (_event, { playlist }) => {
    playlistService?.save(playlist);
  });

  ipcMain.handle('playlist:load', async () => {
    return playlistService?.load();
  });

  // Library Management
  ipcMain.handle('library:add-folder', async (_event, { path }) => {
    await libraryService?.addFolder(path);
    return libraryService?.getTracks();
  });

  ipcMain.handle('library:pick-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('library:remove-folder', async (_event, { path }) => {
    await libraryService?.removeFolder(path);
    return libraryService?.getTracks();
  });

  ipcMain.handle('library:scan', async () => {
    return await libraryService?.scan();
  });

  ipcMain.handle('library:get-all', async () => {
    return libraryService?.getTracks();
  });

  ipcMain.handle('library:get-folders', async () => {
    return libraryService?.getFolders();
  });

  // Media Engine Handlers
  ipcMain.handle('media:get-stream-url', async (_event, { filePath }) => {
    if (!mediaServer) throw new Error('Media server not running');
    const ext = path.extname(filePath).toLowerCase();
    const directPlayExtensions = ['.mp4', '.webm', '.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
    const baseUrl = mediaServer.getUrl();
    if (directPlayExtensions.includes(ext)) {
      return `${baseUrl}/file?path=${encodeURIComponent(filePath)}`;
    } else {
      return `${baseUrl}/stream?path=${encodeURIComponent(filePath)}`;
    }
  });

  ipcMain.handle('media:get-metadata', async (_event, { filePath }) => {
    if (!mediaServer) throw new Error('Media server not running');
    return mediaServer.getMetadata(filePath);
  });

  ipcMain.handle('media:get-subtitles-url', async (_event, { filePath }) => {
    if (!mediaServer) throw new Error('Media server not running');
    const baseUrl = mediaServer.getUrl();
    return `${baseUrl}/subtitles?path=${encodeURIComponent(filePath)}`;
  });

  // File operations
  ipcMain.handle('file:open-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Media Files', extensions: ['mp3', 'mp4', 'mkv', 'avi', 'flac', 'wav', 'webm', 'm4a', 'ogg'] },
      ],
    });
    return result.canceled ? null : result.filePaths;
  });

  // Job management
  ipcMain.handle('job:start-conversion', async (_event, request) => {
    const jobId = await jobManager.startConversion(request);
    return { jobId };
  });

  ipcMain.handle('job:start-download', async (_event, request) => {
    const jobId = await jobManager.startDownload(request);
    return { jobId };
  });

  ipcMain.handle('job:cancel', async (_event, { jobId }) => {
    jobManager.cancelJob(jobId);
  });

  ipcMain.handle('job:get-all', async () => {
    return jobManager.getAllJobs();
  });

  ipcMain.handle('job:clear-history', async () => {
    settingsService?.clearHistory();
    return [];
  });

  // Settings Handlers
  ipcMain.handle('settings:get', async () => {
    return settingsService?.getSettings();
  });

  ipcMain.handle('settings:update', async (_event, updates) => {
    settingsService?.updateSettings(updates);
    return settingsService?.getSettings();
  });

  // Downloads
  ipcMain.handle('download:get-formats', async () => {
    return [];
  });

  // Window controls
  ipcMain.handle('window:minimize', async () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window:maximize', async () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle('window:close', async () => {
    mainWindow?.close();
  });

  // Update Management
  ipcMain.handle('update:check', () => {
    updateService?.checkForUpdates();
  });

  ipcMain.handle('update:download', () => {
    updateService?.downloadUpdate();
  });

  ipcMain.handle('update:install', () => {
    updateService?.quitAndInstall();
  });

  ipcMain.handle('app:get-downloads-path', async () => {
    return settingsService?.getSettings().downloadsPath || path.join(app.getPath('videos'), 'GingerPlayer');
  });

  // Background initialization (non-blocking)
  downloadService?.init().catch(err => {
    console.error('Failed to initialize DownloadService in background:', err);
  });
}

function registerGlobalShortcuts(): void {
  globalShortcut.register('MediaPlayPause', () => {
    // TODO: Toggle playback via IPC to renderer if possible or main-controlled
    console.log('Media Play/Pause pressed');
  });
  globalShortcut.register('MediaNextTrack', () => console.log('Media Next'));
  globalShortcut.register('MediaPreviousTrack', () => console.log('Media Previous'));
}

if (!gotTheLock) {
  console.log('[Main] Failed to get single instance lock. Quitting.');
  app.quit();
  process.exit(0); // Force exit to prevent further execution (like ready event)
} else {
  console.log('[Main] Single instance lock obtained.');

  app.on('second-instance', (_event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      handleCommandLineArgs(commandLine);
    }
  });

  if (process.platform === 'win32' && require('electron-squirrel-startup')) {
    console.log('[Main] Squirrel startup detected. Quitting.');
    app.quit();
    process.exit(0);
  }

  // Only start the app if we have the lock
  app.on('ready', async () => {
    downloadService = new DownloadService();
    mediaServer = new MediaServer(
      downloadService.getFFmpegPath(),
      downloadService.getFFprobePath()
    );

    try {
      const url = await mediaServer.start();
      console.log('Media server started at:', url);
    } catch (err) {
      console.error('Failed to start media server:', err);
    }

    createWindow();
    await registerIpcHandlers();
    registerGlobalShortcuts();

    mainWindow?.webContents.on('did-finish-load', () => {
      handleCommandLineArgs(process.argv);
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    mainWindow?.show();
  }
});

app.on('before-quit', () => {
  (app as any).isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
