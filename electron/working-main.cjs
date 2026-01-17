const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'dist/preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the built renderer
  mainWindow.loadFile('dist/renderer/index.html');
  
  // Open dev tools
  mainWindow.webContents.openDevTools();
}

// Minimal IPC handlers to prevent errors
ipcMain.handle('db:settings:get', async () => {
  return { success: true, data: {} };
});

ipcMain.handle('db:customers:get-all', async () => {
  return { success: true, data: [] };
});

ipcMain.handle('db:products:get-all', async () => {
  return { success: true, data: [] };
});

ipcMain.handle('db:auth:check-setup', async () => {
  return { success: true, data: { isSetup: false } };
});

ipcMain.handle('peripherals:discover', async () => {
  return { success: true, data: [] };
});

app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});