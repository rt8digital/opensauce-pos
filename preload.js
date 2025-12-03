const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // File dialog operations
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    saveFile: () => ipcRenderer.invoke('dialog:saveFile'),

    // Receipt printing
    printReceipt: (receiptData) => ipcRenderer.invoke('print-receipt', receiptData),

    // Printer operations
    testPrinter: (printerType, printerAddress) => ipcRenderer.invoke('printer:test', printerType, printerAddress),
    printEscPos: (order, printerType, printerAddress) => ipcRenderer.invoke('printer:print-escpos', order, printerType, printerAddress),

    // Cash drawer operations
    openCashDrawer: (port, pulseDuration) => ipcRenderer.invoke('cashdrawer:open', port, pulseDuration),

    // Scale operations
    connectScale: (port) => ipcRenderer.invoke('scale:connect', port),
    disconnectScale: () => ipcRenderer.invoke('scale:disconnect'),
    readScaleWeight: () => ipcRenderer.invoke('scale:read-weight'),
    tareScale: () => ipcRenderer.invoke('scale:tare'),

    // Customer display operations
    updateCustomerDisplay: (content, displayType, displayAddress) => ipcRenderer.invoke('customer-display:update', content, displayType, displayAddress),
    clearCustomerDisplay: (displayType, displayAddress) => ipcRenderer.invoke('customer-display:update', { header: '', items: [], total: '', footer: '' }, displayType, displayAddress),

    // Peripheral discovery
    discoverPeripherals: () => ipcRenderer.invoke('peripherals:discover'),

    // Platform information
    platform: process.platform,

    // Version information
    versions: {
        node: process.versions.node,
        chrome: process.versions.chrome,
        electron: process.versions.electron,
    },
});
