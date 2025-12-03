const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';

// Conditional imports for peripheral support
let escpos, USB, Network, SerialPort;
try {
  escpos = require('escpos');
  USB = require('escpos-usb');
  Network = require('escpos-network');
  SerialPort = require('serialport').SerialPort;
} catch (error) {
  console.warn('Peripheral libraries not available:', error);
}

// Conditional import for WhatsApp Web automation
let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (error) {
  console.warn('Puppeteer not available for WhatsApp automation:', error);
}

let mainWindow;
let serverProcess;
let whatsappProcess;
let cashDrawerPort = null;
let scalePort = null;
let customerDisplayPort = null;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'client/public/icon-512.png'),
    titleBarStyle: 'default',
    show: false, // Don't show until ready
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:5173' // Vite dev server
    : `file://${path.join(__dirname, 'dist/public/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }
    if (whatsappProcess) {
      whatsappProcess.kill();
      whatsappProcess = null;
    }

    // Close peripheral connections
    if (cashDrawerPort) {
      cashDrawerPort.close();
    }
    if (scalePort) {
      scalePort.close();
    }
    if (customerDisplayPort) {
      customerDisplayPort.close();
    }
  });
}

// Start the Express server in production
function startServer() {
  if (!isDev) {
    serverProcess = spawn('node', [path.join(__dirname, 'dist/index.js')], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });

    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
    });
  }
}

// Start WhatsApp Web JS server
function startWhatsAppServer() {
  if (!isDev) {
    whatsappProcess = spawn('node', [path.join(__dirname, 'dist/whatsapp.js')], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });

    whatsappProcess.on('error', (error) => {
      console.error('Failed to start WhatsApp server:', error);
    });
  }
}

// App event handlers
app.whenReady().then(() => {
  startServer();
  startWhatsAppServer();
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

// IPC handlers for native functionality
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile']
  });
  return result;
});

ipcMain.handle('dialog:saveFile', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    properties: ['createDirectory', 'showOverwriteConfirmation']
  });
  return result;
});

ipcMain.handle('print-receipt', async (event, receiptData) => {
  // Handle receipt printing
  // This would integrate with the printer hardware
  console.log('Printing receipt:', receiptData);
});

// Peripheral IPC handlers
ipcMain.handle('printer:test', async (event, printerType, printerAddress) => {
  if (!escpos) {
    return { success: false, error: 'ESC/POS libraries not available' };
  }

  try {
    switch (printerType) {
      case 'usb':
        // In a real app, we'd try to print a test page
        // For now, just checking if we can find devices is a good test
        const devices = await USB.getDevices();
        if (devices.length === 0) {
          return { success: false, error: 'No USB printers found' };
        }
        return { success: true, message: `Found ${devices.length} USB printer(s)` };

      case 'network':
        if (!printerAddress) {
          return { success: false, error: 'Network printer requires IP address' };
        }
        // Basic TCP connection test could go here
        const device = new Network(printerAddress.split(':')[0], parseInt(printerAddress.split(':')[1]) || 9100);
        return { success: true, message: 'Network printer configured' };

      case 'bluetooth':
        // Electron doesn't natively support Bluetooth printing easily without native modules
        // This is better handled in the client or via specific Bluetooth serial adapters
        return { success: false, error: 'Bluetooth printing not supported in Desktop mode yet' };

      default:
        return { success: false, error: `Unsupported printer type: ${printerType}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('printer:print-escpos', async (event, order, printerType, printerAddress) => {
  if (!escpos) {
    return { success: false, error: 'ESC/POS libraries not available' };
  }

  try {
    let device;
    let printer;

    switch (printerType) {
      case 'usb':
        const devices = await USB.getDevices();
        if (devices.length > 0) {
          // Use the first found device or match by ID if provided
          // For robustness, we should allow selecting specific USB device
          device = await USB.findById(devices[0].vendorId, devices[0].productId);
        } else {
          // Fallback to auto-detection if no devices found by getDevices (sometimes unreliable)
          device = new USB();
        }
        break;

      case 'network':
        if (!printerAddress) {
          throw new Error('Network printer requires IP address');
        }
        device = new Network(printerAddress.split(':')[0], parseInt(printerAddress.split(':')[1]) || 9100);
        break;

      default:
        throw new Error(`Unsupported printer type: ${printerType}`);
    }

    printer = new escpos.Printer(device);

    // Connect to device with timeout
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Printer connection timeout')), 5000);
      device.open((err) => {
        clearTimeout(timeout);
        if (err) reject(err);
        else resolve();
      });
    });

    // Print receipt
    printer
      .font('a')
      .align('ct')
      .style('bu')
      .size(1, 1)
      .text('STORE RECEIPT')
      .style('normal')
      .size(0, 0)
      .text(new Date(order.createdAt).toLocaleString())
      .text('--------------------------------')
      .align('lt');

    // Print items
    order.items.forEach(item => {
      printer
        .text(`${item.quantity}x ${item.productName}`)
        .align('rt')
        .text(`$${(Number(item.price) * item.quantity).toFixed(2)}`)
        .align('lt');
    });

    printer
      .text('--------------------------------')
      .align('rt')
      .size(1, 1)
      .text(`Total: $${Number(order.total).toFixed(2)}`)
      .size(0, 0)
      .align('ct')
      .text('Thank you for your purchase!')
      .cut()
      .close();

    return { success: true };
  } catch (error) {
    console.error('Print error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('cashdrawer:open', async (event, port, pulseDuration = 100) => {
  if (!SerialPort) {
    return { success: false, error: 'SerialPort library not available' };
  }

  try {
    // If no port specified, try to find a printer to send the kick code to
    // Many cash drawers are connected to the receipt printer
    if (!port || port === 'printer') {
      // Try to open via default USB printer
      if (escpos && USB) {
        try {
          const device = new USB();
          const printer = new escpos.Printer(device);
          await new Promise((resolve, reject) => {
            device.open((err) => {
              if (err) reject(err);
              else resolve();
            });
          });

          printer.cashdraw(2).close(); // Pin 2 is standard
          return { success: true };
        } catch (e) {
          console.warn('Failed to open cash drawer via printer:', e);
          // Fall through to serial attempt
        }
      }
    }

    // Direct serial connection logic
    let targetPort = port;
    if (!targetPort) {
      const ports = await SerialPort.list();
      // Heuristic: Look for ports with "serial" or "com" in name
      const likelyPort = ports.find(p =>
        p.path.toLowerCase().includes('usb') ||
        p.path.toLowerCase().includes('com')
      );

      if (likelyPort) {
        targetPort = likelyPort.path;
      } else if (ports.length > 0) {
        targetPort = ports[0].path;
      } else {
        throw new Error('No serial ports available');
      }
    }

    // Standard Epson Kick Codes
    // Pin 2: 1B 70 00 19 64 (25ms on, 100ms off)
    // Pin 5: 1B 70 01 19 64
    const openCommand = Buffer.from([0x1B, 0x70, 0x00, 0x19, 0x64]);

    cashDrawerPort = new SerialPort({ path: targetPort, baudRate: 9600 });

    await new Promise((resolve, reject) => {
      cashDrawerPort.write(openCommand, (err) => {
        if (err) reject(err);
        else {
          // Give it a moment to fire before closing
          setTimeout(resolve, 200);
        }
      });
    });

    cashDrawerPort.close();
    cashDrawerPort = null;

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('scale:connect', async (event, port) => {
  if (!SerialPort) {
    return { success: false, error: 'SerialPort library not available' };
  }

  try {
    if (!port) {
      return { success: false, error: 'Port is required' };
    }

    if (scalePort && scalePort.isOpen) {
      scalePort.close();
    }

    // Connect to scale
    scalePort = new SerialPort({
      path: port,
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none'
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('scale:disconnect', async () => {
  try {
    if (scalePort) {
      if (scalePort.isOpen) {
        scalePort.close();
      }
      scalePort = null;
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('scale:read-weight', async () => {
  // ... (Keep existing simulated implementation for now as requested to ignore scales)
  return {
    success: true,
    weight: Math.random() * 10,
    unit: 'kg',
    stable: true,
    timestamp: new Date().toISOString()
  };
});

ipcMain.handle('scale:tare', async () => {
  // ... (Keep existing placeholder)
  return { success: true };
});

ipcMain.handle('customer-display:update', async (event, content, displayType, displayAddress) => {
  if (!SerialPort) {
    return { success: false, error: 'SerialPort library not available' };
  }

  try {
    if (!displayAddress) {
      return { success: false, error: 'Display port required' };
    }

    // Close existing connection if different port
    if (customerDisplayPort && customerDisplayPort.path !== displayAddress) {
      if (customerDisplayPort.isOpen) customerDisplayPort.close();
      customerDisplayPort = null;
    }

    if (!customerDisplayPort) {
      customerDisplayPort = new SerialPort({
        path: displayAddress,
        baudRate: 9600
      });
    }

    // Standard VFD Commands (Epson/Partner Tech)
    const CLR = 0x0C; // Clear display
    const CR = 0x0D;  // Carriage return
    const ESC = 0x1B;

    const buffer = Buffer.from([
      CLR, // Clear
      ...Buffer.from(content.line1 || '').slice(0, 20), // Line 1 (max 20 chars)
      CR, // Move to next line (some displays use different command)
      ...Buffer.from(content.line2 || '').slice(0, 20)  // Line 2
    ]);

    await new Promise((resolve, reject) => {
      customerDisplayPort.write(buffer, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('peripherals:discover', async () => {
  try {
    const devices = [];

    // Discover USB printers
    if (USB) {
      try {
        const usbDevices = await USB.getDevices();
        usbDevices.forEach((device, index) => {
          devices.push({
            id: `usb-printer-${index}`,
            name: device.name || `USB Printer ${index}`,
            type: 'printer',
            status: 'disconnected',
            connectionType: 'usb',
            vendorId: device.vendorId,
            productId: device.productId
          });
        });
      } catch (error) {
        console.warn('Error discovering USB printers:', error);
      }
    }

    // Discover serial ports
    if (SerialPort) {
      try {
        const ports = await SerialPort.list();
        ports.forEach((port, index) => {
          // Try to guess device type based on manufacturer or pnpId
          let type = 'unknown';
          const pnpId = (port.pnpId || '').toLowerCase();
          const manufacturer = (port.manufacturer || '').toLowerCase();

          if (pnpId.includes('print') || manufacturer.includes('epson') || manufacturer.includes('star')) {
            type = 'printer';
          } else if (pnpId.includes('scan') || manufacturer.includes('honeywell') || manufacturer.includes('zebra')) {
            type = 'scanner';
          } else if (pnpId.includes('display') || pnpId.includes('vfd')) {
            type = 'display';
          }

          devices.push({
            id: `serial-${index}`,
            name: port.path,
            label: `${port.path} (${port.manufacturer || 'Unknown'})`,
            type: type,
            status: 'disconnected',
            connectionType: 'serial',
            address: port.path
          });
        });
      } catch (error) {
        console.warn('Error discovering serial ports:', error);
      }
    }

    return { success: true, devices };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// WhatsApp Web automation handler
ipcMain.handle('sendWhatsAppMessage', async (event, url, message) => {
  if (!puppeteer) {
    return { success: false, error: 'Puppeteer not available for WhatsApp automation' };
  }

  let browser = null;
  try {
    // Launch browser in headless mode for automation
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // <- this one doesn't work in Windows
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Navigate to WhatsApp Web with pre-filled message
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for WhatsApp Web to load (look for the chat input area)
    await page.waitForSelector('div[contenteditable="true"][data-tab="10"]', { timeout: 30000 });

    // Wait a bit more for the interface to fully load
    await page.waitForTimeout(2000);

    // Check if we're logged in (look for the main chat interface)
    const isLoggedIn = await page.$('div[contenteditable="true"][data-tab="10"]') !== null;

    if (!isLoggedIn) {
      await browser.close();
      return {
        success: false,
        error: 'WhatsApp Web not logged in. Please scan QR code first.'
      };
    }

    // The message should already be pre-filled in the URL
    // Click the send button
    const sendButton = await page.$('span[data-icon="send"]');
    if (sendButton) {
      await sendButton.click();

      // Wait for the message to be sent (send button should disappear)
      await page.waitForTimeout(2000);

      await browser.close();
      return { success: true };
    } else {
      // Fallback: try to press Enter
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);

      await browser.close();
      return { success: true };
    }

  } catch (error) {
    console.error('WhatsApp automation error:', error);
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    return {
      success: false,
      error: error.message || 'Failed to send WhatsApp message'
    };
  }
});

// Security: Prevent navigation to external websites
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    if (parsedUrl.origin !== 'http://localhost:5173' && parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });
});
