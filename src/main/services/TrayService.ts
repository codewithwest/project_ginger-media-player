import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron';
import path from 'path';

export class TrayService {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow | null = null;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  createTray() {
    // Attempt to find an icon
    const iconPath = this.getIconPath();
    const icon = nativeImage.createFromPath(iconPath);
    
    // Fallback if no icon found? Electron might show transparent or default
    // On Linux/Windows, we really need an icon.
    
    this.tray = new Tray(icon);
    this.tray.setToolTip('Ginger Media Player');
    
    this.updateContextMenu();
    
    this.tray.on('double-click', () => {
      this.toggleWindow();
    });
    
    this.tray.on('click', () => {
      this.toggleWindow();
    });
  }

  private getIconPath(): string {
    // In production, resources are usually in process.resourcesPath
    // In dev, maybe in public or assets? 
    // For now, let's try a common location or just a dummy
    // TODO: Add a real icon
    return path.join(__dirname, '../../assets/icon.png');
  }

  private updateContextMenu() {
    if (!this.tray) return;

    const contextMenu = Menu.buildFromTemplate([
      { 
        label: 'Show/Hide', 
        click: () => this.toggleWindow() 
      },
      { type: 'separator' },
      { 
        label: 'Quit', 
        click: () => {
          app.quit();
        } 
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  private toggleWindow() {
    if (!this.mainWindow) return;

    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
