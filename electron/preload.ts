const { contextBridge, ipcRenderer } = require('electron');
import { ElectronAPI } from '../types/electron';

const api: ElectronAPI = {
  // Database operations for orders
  getOrders: () => ipcRenderer.invoke('db:orders:get-all'),
  getOrdersByDateRange: (startDate: string, endDate: string) => ipcRenderer.invoke('db:orders:get-by-date-range', startDate, endDate),
  getOrderById: (id: number) => ipcRenderer.invoke('db:orders:get-by-id', id),
  createOrder: (data: any) => ipcRenderer.invoke('db:orders:create', data),
  bulkImportOrders: (orders: any[]) => ipcRenderer.invoke('db:orders:bulk-import', orders),
  voidOrder: (orderId: number, userId: number, reason?: string) => ipcRenderer.invoke('db:orders:void-order', { orderId, userId, reason }),
  voidItems: (itemIds: number[], userId: number, reason?: string) => ipcRenderer.invoke('db:orders:void-items', { itemIds, userId, reason }),

  // Database operations for products
  getProducts: () => ipcRenderer.invoke('db:products:get-all'),
  getProductById: (id: number) => ipcRenderer.invoke('db:products:get-by-id', id),
  getProductByBarcode: (barcode: string) => ipcRenderer.invoke('db:products:get-by-barcode', barcode),
  createProduct: (data: any) => ipcRenderer.invoke('db:products:create', data),
  updateProduct: (id: number, updates: any) => ipcRenderer.invoke('db:products:update', id, updates),
  deleteProduct: (id: number) => ipcRenderer.invoke('db:products:delete', id),

  // Database operations for customers
  getCustomers: () => ipcRenderer.invoke('db:customers:get-all'),
  createCustomer: (data: any) => ipcRenderer.invoke('db:customers:create', data),
  getCustomerById: (id: number) => ipcRenderer.invoke('db:customers:get-by-id', id),
  updateCustomer: (id: number, updates: any) => ipcRenderer.invoke('db:customers:update', id, updates),
  deleteCustomer: (id: number) => ipcRenderer.invoke('db:customers:delete', id),
  searchCustomers: (searchTerm: string, limit?: number) => ipcRenderer.invoke('db:customers:search', searchTerm, limit),
  updateCustomerLoyalty: (customerId: number, orderTotal: string) => ipcRenderer.invoke('db:customers:update-loyalty', customerId, orderTotal),

  // Database operations for categories
  getCategories: () => ipcRenderer.invoke('db:categories:get-all'),
  createCategory: (data: any) => ipcRenderer.invoke('db:categories:create', data),
  deleteCategory: (id: number) => ipcRenderer.invoke('db:categories:delete', id),

  // Database operations for discounts
  getDiscounts: () => ipcRenderer.invoke('db:discounts:get-all'),

  // Database operations for settings
  getSettings: () => ipcRenderer.invoke('db:settings:get'),
  updateSettings: (updates: any) => ipcRenderer.invoke('db:settings:update', updates),

  // Database operations for factory reset
  factoryReset: () => ipcRenderer.invoke('db:database:factory-reset'),

  // Database operations for users
  getUsers: () => ipcRenderer.invoke('db:users:get-all'),
  createUser: (userData: any) => ipcRenderer.invoke('db:users:create', userData),
  updateUser: (id: number, updates: any) => ipcRenderer.invoke('db:users:update', id, updates),
  deleteUser: (id: number) => ipcRenderer.invoke('db:users:delete', id),
  changeUserPin: (id: number, pin: string) => ipcRenderer.invoke('db:users:change-pin', id, pin),
  login: (pin: string) => ipcRenderer.invoke('db:auth:login', pin),
  checkSetupNeeded: () => ipcRenderer.invoke('db:auth:check-setup'),
  setup: (data: any) => ipcRenderer.invoke('db:auth:setup', data),
  setSession: (userId: number) => ipcRenderer.invoke('db:auth:set-session', userId),
  verifyAdminPin: (userId: number, pin: string) => ipcRenderer.invoke('db:auth:verify-admin-pin', { userId, pin }),

  // Database operations for cash outs
  getDailyCashOutSummary: (date: string) => ipcRenderer.invoke('db:cash-outs:get-daily-summary', date),
  createCashOut: (data: any) => ipcRenderer.invoke('db:cash-outs:create', data),
  getCashOuts: () => ipcRenderer.invoke('db:cash-outs:get-all'),

  // User preferences
  getUserPreference: (key: string) => ipcRenderer.invoke('db:user-preferences:get', key),
  setUserPreference: (data: { key: string; value: string }) => ipcRenderer.invoke('db:user-preferences:set', data),

  // File dialogs
  openFile: (options: any) => ipcRenderer.invoke('dialog:openFile', options),
  saveFile: (options: any) => ipcRenderer.invoke('dialog:saveFile', options),

  // App info
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  isDev: () => ipcRenderer.invoke('is-dev'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  shutdown: () => ipcRenderer.invoke('app:shutdown'),
  dbHealthCheck: () => ipcRenderer.invoke('db:health-check'),
  processImageUpload: (filePath: string) => ipcRenderer.invoke('app:process-image-upload', filePath),

  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // Settings
  openSettings: () => ipcRenderer.invoke('open-settings'),

  // Logging
  log: (level: string, message: string, meta?: any) => ipcRenderer.send('app:log', { level, message, meta }),

  // Peripheral operations (placeholders - need to be implemented in main.ts)
  discoverPeripherals: () => ipcRenderer.invoke('peripherals:discover'),
  testPrinter: (type: string, address: string) => ipcRenderer.invoke('peripherals:test-printer', type, address),
  printReceipt: (order: any, silent?: boolean) => ipcRenderer.invoke('peripherals:print-receipt', order, silent),
  printReport: (htmlContent: string, silent?: boolean) => ipcRenderer.invoke('peripherals:print-report', htmlContent, silent),
  printEscPos: (data: any) => ipcRenderer.invoke('peripherals:print-escpos', data),

  // Cash drawer
  openCashDrawer: (port: string, pulseDuration: number) => ipcRenderer.invoke('peripherals:open-cash-drawer', port, pulseDuration),
  getCashDrawerStatus: () => ipcRenderer.invoke('peripherals:get-cash-drawer-status'),
  closeCashDrawer: () => ipcRenderer.invoke('peripherals:close-cash-drawer'),

  // Customer display
  updateCustomerDisplay: (content: any, displayType?: string) => ipcRenderer.invoke('peripherals:update-customer-display', content, displayType),
  clearCustomerDisplay: (displayType?: string) => ipcRenderer.invoke('peripherals:clear-customer-display', displayType),
  getCustomerDisplayStatus: () => ipcRenderer.invoke('peripherals:get-customer-display-status'),
  openCustomerDisplay: () => ipcRenderer.invoke('window:open-customer-display'),

  onCustomerDisplayUpdate: (callback: (event: any, content: any) => void) => {
    ipcRenderer.on('customer-display:update', callback);
    return () => ipcRenderer.removeListener('customer-display:update', callback);
  },
  onCustomerDisplayClear: (callback: (event: any) => void) => {
    ipcRenderer.on('customer-display:clear', callback);
    return () => ipcRenderer.removeListener('customer-display:clear', callback);
  },

  // Scale
  connectScale: (port: string) => ipcRenderer.invoke('peripherals:connect-scale', port),
  disconnectScale: () => ipcRenderer.invoke('peripherals:disconnect-scale'),
  readScaleWeight: () => ipcRenderer.invoke('peripherals:read-scale-weight'),
  tareScale: () => ipcRenderer.invoke('peripherals:tare-scale'),
  getScaleStatus: () => ipcRenderer.invoke('peripherals:get-scale-status'),

  // Menu event listeners
  onMenuNavigate: (callback: (event: Electron.IpcRendererEvent, path: string) => void) => {
    ipcRenderer.on('menu:navigate', callback);
    // Return cleanup function
    return () => ipcRenderer.removeListener('menu:navigate', callback);
  },
  onMenuRefresh: (callback: (event: Electron.IpcRendererEvent) => void) => {
    ipcRenderer.on('menu:refresh', callback);
    // Return cleanup function
    return () => ipcRenderer.removeListener('menu:refresh', callback);
  },
  onMenuAbout: (callback: (event: Electron.IpcRendererEvent) => void) => {
    ipcRenderer.on('menu:about', callback);
    // Return cleanup function
    return () => ipcRenderer.removeListener('menu:about', callback);
  },
};

// Expose API via contextBridge
// Note: This preload script only runs in Electron, so we always use contextBridge
// regardless of whether we're loading from Vite dev server or file protocol
contextBridge.exposeInMainWorld('electronAPI', api);
console.log('electronAPI exposed via contextBridge');