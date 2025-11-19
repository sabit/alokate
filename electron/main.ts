import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isMaximized: boolean;
}

const DEFAULT_WINDOW_STATE: WindowState = {
  width: 1280,
  height: 900,
  isMaximized: false,
};

const MIN_WIDTH = 1024;
const MIN_HEIGHT = 768;

let mainWindow: BrowserWindow | null = null;

/**
 * Get the path to the window state file
 */
function getWindowStateFilePath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'window-state.json');
}

/**
 * Restore window state from previous session
 */
function restoreWindowState(): WindowState {
  try {
    const stateFilePath = getWindowStateFilePath();
    if (fs.existsSync(stateFilePath)) {
      const data = fs.readFileSync(stateFilePath, 'utf-8');
      const state = JSON.parse(data) as WindowState;
      
      // Validate the restored state
      if (state.width >= MIN_WIDTH && state.height >= MIN_HEIGHT) {
        return state;
      }
    }
  } catch (error) {
    console.error('Failed to restore window state:', error);
  }
  
  return DEFAULT_WINDOW_STATE;
}

/**
 * Save window state before closing
 */
function saveWindowState(window: BrowserWindow): void {
  try {
    const bounds = window.getBounds();
    const isMaximized = window.isMaximized();
    
    const state: WindowState = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized,
    };
    
    const stateFilePath = getWindowStateFilePath();
    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save window state:', error);
  }
}

/**
 * Create the main application window
 */
function createWindow(): BrowserWindow {
  const windowState = restoreWindowState();
  
  // Create the browser window with restored state
  const window = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    frame: false, // Remove title bar and menu bar
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    show: false, // Don't show until ready-to-show event
  });
  
  // Restore maximized state if needed
  if (windowState.isMaximized) {
    window.maximize();
  }
  
  // Show window when ready to prevent visual flash
  window.once('ready-to-show', () => {
    window.show();
  });
  
  // Save window state before closing
  window.on('close', () => {
    saveWindowState(window);
  });
  
  return window;
}

/**
 * Determine if running in development mode
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || !app.isPackaged;
}

/**
 * Load content based on environment (development vs production)
 */
async function loadContent(window: BrowserWindow): Promise<void> {
  try {
    if (isDevelopment()) {
      // Development mode: load Vite dev server
      const devServerUrl = 'http://localhost:5173';
      console.log(`Loading development server: ${devServerUrl}`);
      await window.loadURL(devServerUrl);
      
      // Open DevTools in development mode
      window.webContents.openDevTools();
    } else {
      // Production mode: load built files from frontend/dist
      const indexPath = path.join(__dirname, '../frontend/dist/index.html');
      console.log(`Loading production build: ${indexPath}`);
      await window.loadFile(indexPath);
    }
  } catch (error) {
    console.error('Failed to load content:', error);
    throw error;
  }
}

/**
 * Initialize the application
 */
async function initializeApp(): Promise<void> {
  try {
    // Set application name and version in window title
    const appName = app.getName();
    const appVersion = app.getVersion();
    
    // Create the main window
    mainWindow = createWindow();
    
    // Set the window title with app name and version
    mainWindow.setTitle(`${appName} v${appVersion}`);
    
    // Load the content
    await loadContent(mainWindow);
    
    // Handle window closed event
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    app.quit();
  }
}

// Application lifecycle handlers

/**
 * Handle app 'ready' event
 */
app.on('ready', () => {
  console.log('Application is ready');
  initializeApp();
});

/**
 * Handle 'window-all-closed' event for proper shutdown
 */
app.on('window-all-closed', () => {
  // On macOS, applications typically stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Handle 'activate' event for macOS behavior
 */
app.on('activate', () => {
  // On macOS, re-create a window when the dock icon is clicked and no other windows are open
  if (BrowserWindow.getAllWindows().length === 0) {
    initializeApp();
  }
});

/**
 * Handle app 'before-quit' event
 */
app.on('before-quit', () => {
  console.log('Application is quitting');
});
