// Main process entry point

import { app, BrowserWindow, ipcMain, dialog, globalShortcut } from 'electron';
import path from 'path';

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

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

import { MediaServer } from './services/MediaServer';
import { TrayService } from './services/TrayService';

let mainWindow: BrowserWindow | null = null;
let mediaServer: MediaServer | null = null;
let trayService: TrayService | null = null;

const createWindow = (): void => {
  // Create the browser window with security settings
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      // CRITICAL SECURITY SETTINGS
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      
      // Preload script
      preload: path.join(__dirname, 'preload.js'),
    },
    // Modern window styling
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

// App lifecycle
app.on('ready', async () => {
  // Start media server
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
});

app.on('window-all-closed', () => {
  // On macOS, keep app running when windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
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
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});

// ... code

// IPC Handlers
function registerIpcHandlers(): void {
  // Media Engine Handlers
  ipcMain.handle('media:get-stream-url', async (_event, { filePath }) => {
    if (!mediaServer) throw new Error('Media server not running');
    // Decide whether to stream or file serve based on extension?
    // For now, let's just use the /stream endpoint for everything so we have consistency,
    // or let the MediaServer logic handle it (which we defined in setupRoutes).
    
    // Actually, our MediaServer has logic:
    // /file?path=... for direct serving
    // /stream?path=... for transcoding
    
    // Simple logic for now: use /stream for everything? No, inefficient for MP4.
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

  // Media controls (stubs for now)
  ipcMain.handle('media:play', async (_event, { sourceId }) => {
    console.log('Play requested:', sourceId);
    // TODO: Implement media engine
  });

  ipcMain.handle('media:pause', async () => {
    console.log('Pause requested');
    // TODO: Implement media engine
  });

  ipcMain.handle('media:stop', async () => {
    console.log('Stop requested');
    // TODO: Implement media engine
  });

  ipcMain.handle('media:seek', async (_event, { position }) => {
    console.log('Seek requested:', position);
    // TODO: Implement media engine
  });

  ipcMain.handle('media:set-volume', async (_event, { volume }) => {
    console.log('Set volume:', volume);
    // TODO: Implement media engine
  });

  ipcMain.handle('media:next', async () => {
    console.log('Next track requested');
    // TODO: Implement playlist logic
  });

  ipcMain.handle('media:previous', async () => {
    console.log('Previous track requested');
    // TODO: Implement playlist logic
  });

  ipcMain.handle('media:toggle-shuffle', async () => {
    console.log('Toggle shuffle');
    // TODO: Implement playlist logic
  });

  ipcMain.handle('media:toggle-repeat', async () => {
    console.log('Toggle repeat');
    // TODO: Implement playlist logic
  });

  // File operations
  ipcMain.handle('file:open-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Media Files', extensions: ['mp3', 'mp4', 'mkv', 'avi', 'flac', 'wav', 'webm', 'm4a', 'ogg'] },
        { name: 'Audio Files', extensions: ['mp3', 'flac', 'wav', 'm4a', 'ogg', 'aac'] },
        { name: 'Video Files', extensions: ['mp4', 'mkv', 'avi', 'webm', 'mov'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    return result.canceled ? null : result.filePaths;
  });

  ipcMain.handle('file:add-to-playlist', async (_event, { paths }) => {
    console.log('Add to playlist:', paths);
    // TODO: Implement playlist logic
    return [];
  });

  // Job management (stubs)
  ipcMain.handle('job:start-conversion', async (_event, request) => {
    console.log('Start conversion:', request);
    // TODO: Implement conversion service
    return { jobId: 'stub-job-id' };
  });

  ipcMain.handle('job:start-download', async (_event, request) => {
    console.log('Start download:', request);
    // TODO: Implement download service
    return { jobId: 'stub-job-id' };
  });

  ipcMain.handle('job:cancel', async (_event, { jobId }) => {
    console.log('Cancel job:', jobId);
    // TODO: Implement job manager
  });

  ipcMain.handle('job:get-all', async () => {
    console.log('Get all jobs');
    // TODO: Implement job manager
    return [];
  });

  // Downloads
  ipcMain.handle('download:get-formats', async (_event, { url }) => {
    console.log('Get formats for:', url);
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
}

// Global shortcuts for media keys
function registerGlobalShortcuts(): void {
  globalShortcut.register('MediaPlayPause', () => {
    console.log('Media Play/Pause pressed');
    // TODO: Toggle playback
  });

  globalShortcut.register('MediaNextTrack', () => {
    console.log('Media Next Track pressed');
    // TODO: Next track
  });

  globalShortcut.register('MediaPreviousTrack', () => {
    console.log('Media Previous Track pressed');
    // TODO: Previous track
  });
}
