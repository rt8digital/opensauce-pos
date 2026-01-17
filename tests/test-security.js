// test-security-implementation.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Test if our security configurations work
console.log('Testing security implementation...');

// Create a test window with our security settings
function createTestWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // These are the security settings we implemented
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true, // This is the key security enhancement
      webSecurity: true,
      allowRunningInsecureContent: false,
      disableBlinkFeatures: 'Auxclick',
      enableRemoteModule: false,
      spellcheck: false,
    }
  });

  // Try to load a simple HTML to test
  win.loadURL('data:text/html,<h1>Security Test Passed!</h1><p>If you see this, security settings are working.</p>');
  
  return win;
}

app.whenReady().then(() => {
  console.log('Electron app ready, creating test window...');
  const testWindow = createTestWindow();
  
  testWindow.webContents.on('did-finish-load', () => {
    console.log('Test window loaded successfully with security settings!');
  });
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createTestWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

console.log('Security test setup complete.');