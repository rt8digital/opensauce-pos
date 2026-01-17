const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let viteProcess = null;
let mainWindow = null;

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
  mainWindow.loadFile(path.join(__dirname, 'dist/renderer/index.html'));
  
  // Open dev tools
  mainWindow.webContents.openDevTools();
}

function startViteDevServer() {
  console.log('Starting Vite development server...');
  
  viteProcess = spawn('npx', ['vite', '--host', '--port', '5173', '--strictPort'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  viteProcess.on('close', (code) => {
    console.log(`Vite process exited with code ${code}`);
  });

  viteProcess.on('error', (error) => {
    console.error('Failed to start Vite:', error);
  });
}

app.whenReady().then(() => {
  // Start Vite dev server
  startViteDevServer();
  
  // Wait a bit for Vite to start, then create window
  setTimeout(() => {
    createWindow();
  }, 3000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (viteProcess) {
      viteProcess.kill();
    }
    app.quit();
  }
});

app.on('before-quit', () => {
  if (viteProcess) {
    viteProcess.kill();
  }
});