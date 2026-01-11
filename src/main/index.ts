
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


// Security: Disable remote module
app.on('remote-require', (event) => {
  event.preventDefault();
});

app.on('remote-get-builtin', (event) => {
  event.preventDefault();
});

app.on('remote-get-global', (event) => {
  event.preventDefault();
});

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();

let mainWindow: BrowserWindow | null = null;
let mediaServer: MediaServer | null = null;
let trayService: TrayService | null = null;
let libraryService: LibraryService | null = null;
let playlistService: PlaylistService | null = null;
let updateService: UpdateService | null = null;

function handleCommandLineArgs(argv: string[]) {
  const args = argv.slice(app.isPackaged ? 1 : 2);
  const filePath = args.find(arg => !arg.startsWith('-'));
  
  if (filePath && mainWindow) {
    console.log('Opening file from CLI:', filePath);
    mainWindow.webContents.send('file:open-from-cli', filePath);
  }
}

const createWindow = (): void => {
  // Create the browser window with security settings
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
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
    trafficLightPosition: { x: 15, y: 15 },
  });

  // Load the index.html of the app
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Handle window close - keep app running for background playback
  mainWindow.on('close', (event) => {
    if (!(app as any).isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
    return false;
  });
  
  // Initialize Tray Service
  trayService = new TrayService(mainWindow);
  trayService.createTray();
};

function registerIpcHandlers(): void {
  // Initialize Services
  // Note: mainWindow is created before this function is called
  const jobManager = new JobManager(mainWindow!);
  const conversionService = new ConversionService();
  const downloadService = new DownloadService();
  libraryService = new LibraryService();
  playlistService = new PlaylistService();
  updateService = new UpdateService(mainWindow!);
  new ReleaseService();
  
  jobManager.registerService('conversion', conversionService);
  jobManager.registerService('download', downloadService);

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
    const directPlayExtensions = ['.mp4', '.webm', '.mp3', '.wav', '.ogg', '.m4a', '.aac'];
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

  // Downloads
  ipcMain.handle('download:get-formats', async (_event, { url }) => {
    // TODO: Implement yt-dlp integration
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
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      handleCommandLineArgs(commandLine);
    }
  });

  if (require('electron-squirrel-startup')) {
    app.quit();
  }
}

app.on('ready', async () => {
  mediaServer = new MediaServer();
  try {
    const url = await mediaServer.start();
    console.log('Media server started at:', url);
  } catch (err) {
    console.error('Failed to start media server:', err);
  }

  createWindow();
  registerIpcHandlers();
  registerGlobalShortcuts();

  mainWindow?.webContents.on('did-finish-load', () => {
    handleCommandLineArgs(process.argv);
  });
});

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
