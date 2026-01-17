export interface ElectronAPI {
    // Database operations for orders
    getOrders: () => Promise<any[]>;
    getOrdersByDateRange: (startDate: string, endDate: string) => Promise<any[]>;
    getOrderById: (id: number) => Promise<any>;
    createOrder: (data: any) => Promise<any>;
    bulkImportOrders: (orders: any[]) => Promise<any>;
    voidOrder: (orderId: number, userId: number, reason?: string) => Promise<{ success: boolean; orderId: number }>;
    voidItems: (itemIds: number[], userId: number, reason?: string) => Promise<{ success: boolean; order: any }>;

    // Database operations for products
    getProducts: () => Promise<any[]>;
    getProductById: (id: number) => Promise<any>;
    getProductByBarcode: (barcode: string) => Promise<any>;
    createProduct: (data: any) => Promise<any>;
    updateProduct: (id: number, updates: any) => Promise<any>;
    deleteProduct: (id: number) => Promise<{ rowsAffected: number }>;

    // Database operations for customers
    getCustomers: () => Promise<any[]>;
    createCustomer: (data: any) => Promise<any>;
    getCustomerById: (id: number) => Promise<any>;
    updateCustomer: (id: number, updates: any) => Promise<any>;
    deleteCustomer: (id: number) => Promise<{ rowsAffected: number }>;
    searchCustomers: (searchTerm: string, limit?: number) => Promise<any[]>;
    updateCustomerLoyalty: (customerId: number, orderTotal: string) => Promise<any>;

    // Database operations for categories
    getCategories: () => Promise<any[]>;
    createCategory: (data: any) => Promise<any>;
    deleteCategory: (id: number) => Promise<any>;

    // Database operations for discounts
    getDiscounts: () => Promise<any[]>;

    // Database operations for settings
    getSettings: () => Promise<any>;
    updateSettings: (updates: any) => Promise<any>;

    // Database operations for factory reset
    factoryReset: () => Promise<any>;

    // Database operations for users
    getUsers: () => Promise<any[]>;
    createUser: (userData: any) => Promise<any>;
    updateUser: (id: number, updates: any) => Promise<any>;
    deleteUser: (id: number) => Promise<{ rowsAffected: number }>;
    changeUserPin: (id: number, pin: string) => Promise<any>;
    login: (pin: string) => Promise<{ user: any }>;
    checkSetupNeeded: () => Promise<boolean>;
    setup: (data: any) => Promise<{ user: any }>;
    setSession: (userId: number) => Promise<boolean>;
    verifyAdminPin: (userId: number, pin: string) => Promise<{ success: boolean; message?: string }>;
    dbHealthCheck: () => Promise<{ initialized: boolean; path: string; error: string | null }>;
    processImageUpload: (filePath: string) => Promise<{ success: boolean; dataUrl?: string; error?: string }>;

    // Database operations for cash outs
    getDailyCashOutSummary: (date: string) => Promise<any>;
    createCashOut: (data: any) => Promise<any>;
    getCashOuts: () => Promise<any[]>;

    // User preferences
    getUserPreference: (key: string) => Promise<string | null>;
    setUserPreference: (data: { key: string; value: string }) => Promise<any>;

    // File dialogs
    openFile: (options: any) => Promise<string | null>;
    saveFile: (options: any) => Promise<string | null>;

    // App info
    getAppPath: () => Promise<string>;
    isDev: () => Promise<boolean>;
    getAppVersion: () => Promise<string>;
    shutdown: () => Promise<void>;

    // Window controls
    minimize: () => void;
    maximize: () => void;
    close: () => void;

    // Settings
    openSettings: () => Promise<void>;

    // Logging
    log: (level: string, message: string, meta?: any) => void;

    // Peripheral operations
    discoverPeripherals: () => Promise<any>;
    testPrinter: (type: string, address: string) => Promise<any>;
    printReceipt: (order: any, silent?: boolean) => Promise<{ success: boolean; error?: string }>;
    printReport: (htmlContent: string, silent?: boolean) => Promise<{ success: boolean; error?: string }>;
    printEscPos: (data: { content: string; type: string; address?: string }) => Promise<{ success: boolean; error?: string }>;

    // Cash drawer
    openCashDrawer: (port: string, pulseDuration: number) => Promise<boolean>;
    getCashDrawerStatus: () => Promise<boolean>;
    closeCashDrawer: () => Promise<boolean>;

    // Customer display
    updateCustomerDisplay: (content: any, displayType?: string) => Promise<boolean>;
    clearCustomerDisplay: (displayType?: string) => Promise<boolean>;
    getCustomerDisplayStatus: () => Promise<boolean>;
    openCustomerDisplay: () => Promise<boolean>;

    // Customer display event listeners
    onCustomerDisplayUpdate: (callback: (event: any, content: any) => void) => () => void;
    onCustomerDisplayClear: (callback: (event: any) => void) => () => void;

    // Scale
    connectScale: (port: string) => Promise<boolean>;
    disconnectScale: () => Promise<boolean>;
    readScaleWeight: () => Promise<number | null>;
    tareScale: () => Promise<boolean>;
    getScaleStatus: () => Promise<boolean>;

    // Menu event listeners
    onMenuNavigate: (callback: (event: Electron.IpcRendererEvent, path: string) => void) => () => void;
    onMenuRefresh: (callback: (event: Electron.IpcRendererEvent) => void) => () => void;
    onMenuAbout: (callback: (event: Electron.IpcRendererEvent) => void) => () => void;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
