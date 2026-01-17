import path from 'path';
import { pathToFileURL } from 'url';
import { app, BrowserWindow, ipcMain, dialog, Menu, type MenuItemConstructorOptions, nativeImage } from 'electron';
import { autoUpdater } from 'electron-updater';
import { Buffer } from 'buffer';

// Note: Autofill disable switch removed due to Electron API changes

// Better environment detection
const isDev = !app.isPackaged;
const isPreloadValid = true; // Should always be true since we bundle it

// Optimize memory usage
app.commandLine.appendSwitch('--max-old-space-size', '4096');
app.commandLine.appendSwitch('--js-flags', '--max-old-space-size=4096');
app.commandLine.appendSwitch('--disk-cache-size', '104857600'); // 100MB cache limit

// Use __dirname in CJS context
const _dirname = __dirname;

// Preload script path - use the built preload.cjs file
const preloadPath = isPreloadValid
    ? path.join(_dirname, 'preload.cjs')
    : path.join(process.cwd(), 'dist/preload.cjs');

import log from 'electron-log';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import fs from 'fs';
import escpos from 'escpos';
import USB from 'escpos-usb';
import Network from 'escpos-network';
import { secureDatabaseHandler, secureFileHandler } from '../src/utils/secure-ipc-handler';
import { SecureFileSystem } from '../src/utils/secure-file-system';
import { z } from 'zod';
import { ProductIdSchema, ProductSchema } from '../src/schemas/ipc-validation';
import { initializeDefaultSchema } from './db-init';

// Configure auto updater
autoUpdater.autoDownload = false; // Download manually to show progress
autoUpdater.autoInstallOnAppQuit = true; // Install on quit

// Auto updater event handlers
autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...');
    if (mainWindow) {
        mainWindow.webContents.send('update-checking');
    }
});

autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info);
    if (mainWindow) {
        mainWindow.webContents.send('update-available', info);

        // Show update notification
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Available',
            message: `Version ${info.version} is available`,
            detail: 'A new version of OpenSauce POS is available. Would you like to download it now?',
            buttons: ['Download Update', 'Remind Me Later']
        }).then(({ response }) => {
            if (response === 0) {
                autoUpdater.downloadUpdate();
                mainWindow?.webContents.send('update-downloading');
            }
        });
    }
});

autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info);
    if (mainWindow) {
        mainWindow.webContents.send('update-not-available');
    }
});

autoUpdater.on('error', (err) => {
    log.error('Update error:', err);
    if (mainWindow) {
        mainWindow.webContents.send('update-error', err.message);
    }
});

autoUpdater.on('download-progress', (progressObj) => {
    log.info(`Download progress: ${progressObj.percent}%`);
    if (mainWindow) {
        mainWindow.webContents.send('update-download-progress', {
            percent: progressObj.percent,
            transferred: progressObj.transferred,
            total: progressObj.total
        });
    }
});

autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info);
    if (mainWindow) {
        mainWindow.webContents.send('update-downloaded', info);

        // Show installation prompt
        dialog.showMessageBox(mainWindow, {
            type: 'question',
            title: 'Update Ready',
            message: 'Update Downloaded',
            detail: 'The update has been downloaded. Would you like to restart the application to install it now?',
            buttons: ['Restart Now', 'Later']
        }).then(({ response }) => {
            if (response === 0) {
                setImmediate(() => autoUpdater.quitAndInstall());
            }
        });
    }
});

let currentUserId: number | null = null;
let mainWindow: BrowserWindow | null = null;
let customerDisplayWindow: BrowserWindow | null = null;

// Helper to check admin access
function checkAdmin() {
    if (!db) throw new Error('Database not initialized');
    if (!currentUserId) throw new Error('Unauthorized: No active session');

    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(currentUserId) as any;
    if (!user || user.role !== 'admin') {
        throw new Error('Access denied: Admin privileges required');
    }
}

log.info('Preload script path:', preloadPath);
log.info('Preload script exists:', fs.existsSync(preloadPath));

// Initialize SQLite database connection
let db: Database.Database | null = null;

function initializeDatabase(): Database.Database | null {
    try {
        log.info('=== DATABASE INITIALIZATION START ===');
        log.info('Node versions:', process.versions);
        log.info('NODE_MODULE_VERSION:', process.versions.modules);
        log.info('Current working directory:', process.cwd());
        log.info('_dirname:', _dirname);
        log.info('Process execPath:', process.execPath);
        log.info('Process resourcesPath:', (process as any).resourcesPath);

        // Add Windows version and system info
        try {
            const os = require('os');
            log.info('OS Platform:', os.platform());
            log.info('OS Release:', os.release());
            log.info('OS Version:', os.version ? os.version() : 'N/A');
            log.info('System Architecture:', os.arch());
            log.info('Total Memory:', Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB');
            log.info('Free Memory:', Math.round(os.freemem() / 1024 / 1024 / 1024) + 'GB');
            log.info('CPU Model:', os.cpus()[0]?.model || 'Unknown');
            log.info('CPU Cores:', os.cpus().length);
        } catch (osError) {
            log.warn('Failed to get OS info:', osError);
        }

        // Check better-sqlite3 version and compilation
        try {
            const betterSqlite3 = require('better-sqlite3');
            log.info('better-sqlite3 version:', betterSqlite3?.version || 'Unknown');
            log.info('better-sqlite3 constructor:', typeof betterSqlite3);
        } catch (sqliteError) {
            log.error('Failed to load better-sqlite3:', sqliteError);
            return null;
        }

        // Determine database path
        let dbPath: string;
        if (isDev) {
            dbPath = path.join(process.cwd(), 'sqlite.db');
            log.info('Using dev database path:', dbPath);
            log.info('Database file exists at dev path:', fs.existsSync(dbPath));
            console.log('DEBUG: Dev mode - dbPath:', dbPath);
            console.log('DEBUG: Dev mode - file exists:', fs.existsSync(dbPath));
        } else {
            // In production, we prefer userData to avoid permission issues in Program Files
            const userDataPath = app.getPath('userData');
            const databaseDir = path.join(userDataPath, 'database');
            dbPath = path.join(databaseDir, 'sqlite.db');

            // Ensure directory exists
            if (!fs.existsSync(databaseDir)) {
                fs.mkdirSync(databaseDir, { recursive: true });
                log.info('Created database directory in userData:', databaseDir);
            }

            // Check if database exists in userData, if not, try to copy from bundled or initialize new
            if (!fs.existsSync(dbPath)) {
                log.info('Database not found in userData, checking for bundled database...');

                // Path to bundled database in the installation directory (from extraFiles)
                // In production unpacked, it's relative to the executable/resources
                const bundledDbPath = isDev
                    ? path.join(process.cwd(), 'sqlite.db')
                    : path.join(path.dirname(app.getPath('exe')), 'database', 'sqlite.db');

                log.info('Checking for bundled database at:', bundledDbPath);

                if (!isDev && fs.existsSync(bundledDbPath)) {
                    try {
                        log.info('Bundled database found, copying to userData...');
                        fs.copyFileSync(bundledDbPath, dbPath);
                        log.info('Bundled database copied successfully');
                    } catch (copyError) {
                        log.error('Failed to copy bundled database:', copyError);
                        // Fallback to initialization if copy fails
                    }
                }

                // If still doesn't exist (copy failed or no bundled db), initialize with default schema
                if (!fs.existsSync(dbPath)) {
                    log.info('Initializing new database at:', dbPath);
                    try {
                        const newDb = new Database(dbPath);
                        newDb.pragma('journal_mode = WAL');
                        log.info('Initializing database schema...');
                        initializeDefaultSchema(newDb);
                        log.info('New database initialized successfully');
                        return newDb;
                    } catch (createError) {
                        log.error('Failed to create new database:', createError);
                        return null;
                    }
                }
            }
            log.info('Using production database path:', dbPath);
        }

        // Log database path existence
        log.info('Database file exists before connection:', fs.existsSync(dbPath));

        // In dev mode, if database doesn't exist, create it with default schema
        if (isDev && !fs.existsSync(dbPath)) {
            log.warn('Database file not found in dev mode, creating new database...');
            console.warn('WARNING: Database file not found at:', dbPath);
            console.log('Creating new database with default schema...');

            try {
                const newDb = new Database(dbPath);
                newDb.pragma('journal_mode = WAL');
                newDb.pragma('foreign_keys = ON');
                log.info('Initializing database schema...');
                initializeDefaultSchema(newDb);
                log.info('New database initialized successfully in dev mode');
                console.log('✅ New database created successfully at:', dbPath);
                return newDb;
            } catch (createError) {
                log.error('Failed to create new database in dev mode:', createError);
                console.error('CRITICAL: Failed to create database:', createError);
                return null;
            }
        }

        // Create database connection and enable WAL mode
        try {
            log.info(`Attempting to connect to database at: ${dbPath}`);
            console.log('Connecting to database:', dbPath);

            const sqlite = new Database(dbPath, { verbose: (msg) => log.debug(`SQL: ${msg}`) });
            log.info('Database connection object created');

            // Enable WAL mode for better performance
            try {
                sqlite.pragma('journal_mode = WAL');
                sqlite.pragma('foreign_keys = ON');
                log.info('Pragmas (WAL, Foreign Keys) set successfully');
            } catch (pragmaError) {
                log.warn('Failed to set pragmas:', pragmaError);
            }

            // Ensure schema is up to date
            log.info('Calling initializeDefaultSchema...');
            initializeDefaultSchema(sqlite);
            log.info('Schema initialization complete');

            db = sqlite;
            log.info('Database initialized and assigned to global scope');
        } catch (connectionError: any) {
            log.error('=== CRITICAL DATABASE CONNECTION FAILURE ===');
            log.error('Error type:', connectionError.constructor?.name || typeof connectionError);
            log.error('Error message:', connectionError.message);
            log.error('Error code:', connectionError.code);
            log.error('Error errno:', connectionError.errno);
            log.error('Full error:', connectionError);
            log.error('Error stack:', connectionError.stack);
            console.error('CRITICAL DATABASE ERROR:', connectionError);

            // Additional diagnostics
            if (connectionError.message && connectionError.message.includes('rebuild')) {
                log.error('This error usually means better-sqlite3 needs to be rebuilt for Electron.');
            }

            if (connectionError.message && connectionError.message.includes('MODULE_NOT_FOUND')) {
                log.error('better-sqlite3 module not found - may need to rebuild native modules');
            }

            if (connectionError.message && connectionError.message.includes('permission')) {
                log.error('Permission denied - check file system permissions for database directory');
            }

            if (connectionError.code === 'SQLITE_CANTOPEN') {
                log.error('Cannot open database file - check permissions and file path');
            }

            return null;
        }

        try {
            if (!db) {
                log.error('db is still null after connection attempt');
                return null;
            }
            const tableInfo = db.prepare("PRAGMA table_info(settings)").all() as any[];
            const hasQrColumn = tableInfo.some(col => col.name === 'receipt_show_qr_code');
            if (!hasQrColumn) {
                log.info('Adding receipt_show_qr_code column to settings table...');
                db.prepare("ALTER TABLE settings ADD COLUMN receipt_show_qr_code INTEGER DEFAULT 0").run();
                log.info('Successfully added receipt_show_qr_code column');
            }

            const hasAdviceColumn = tableInfo.some(col => col.name === 'advice_list');
            if (!hasAdviceColumn) {
                log.info('Adding advice_list column to settings table...');
                db.prepare("ALTER TABLE settings ADD COLUMN advice_list TEXT DEFAULT '[]'").run();
                log.info('Successfully added advice_list column');
            }

            const hasAutoLaunchColumn = tableInfo.some(col => col.name === 'auto_launch_enabled');
            if (!hasAutoLaunchColumn) {
                log.info('Adding auto_launch_enabled column to settings table...');
                db.prepare("ALTER TABLE settings ADD COLUMN auto_launch_enabled INTEGER DEFAULT 0").run();
                log.info('Successfully added auto_launch_enabled column');
            }

            // Ensure settings table has correct schema by checking for critical columns
            // If significant mismatches are found, we drop and recreate to guarantee stability (User Request: "Refactor from scratch")
            const criticalColumns = [
                'printer_type', 'tax_rate', 'whatsapp_enabled', 'camera_scanner_enabled',
                'receipt_header_font', 'auto_launch_enabled'
            ];

            const currentTableInfo = db.prepare("PRAGMA table_info(settings)").all() as any[];
            const existingColumnNames = currentTableInfo.map(c => c.name);
            const missingCritical = criticalColumns.some(col => !existingColumnNames.includes(col));

            if (missingCritical) {
                log.warn('Critical settings schema mismatch detected. Recreating settings table...');
                try {
                    // Backup existing settings if possible
                    const existingSettings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as Record<string, any> | undefined;

                    db.exec('DROP TABLE IF EXISTS settings');

                    // Re-run initialization to create fresh table with full schema
                    // Since we dropped settings, it will be recreated.
                    initializeDefaultSchema(db);

                    // Restore what we can (if it existed)
                    if (existingSettings) {
                        log.info('Restoring preserved settings...');
                        // Get the new column list
                        const newCols = (db.prepare("PRAGMA table_info(settings)").all() as any[]).map(c => c.name);

                        // Construct dynamic insert
                        const validKeys = Object.keys(existingSettings).filter(key => newCols.includes(key));
                        if (validKeys.length > 0) {
                            const placeholders = validKeys.map(() => '?').join(',');
                            const stmt = db.prepare(`INSERT OR REPLACE INTO settings (${validKeys.join(',')}) VALUES (${placeholders})`);
                            stmt.run(...validKeys.map(key => existingSettings[key]));
                        }
                    } else {
                        // Ensure default row exists
                        const count = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
                        if (count.count === 0) {
                            db.prepare('INSERT INTO settings (id) VALUES (1)').run();
                        }
                    }
                    log.info('Settings table recreated successfully.');
                } catch (err) {
                    log.error('Failed to recreate settings table:', err);
                }
            } else {
                // Double check we have a row
                const count = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
                if (count.count === 0) {
                    db.prepare('INSERT INTO settings (id) VALUES (1)').run();
                }
            }

            log.info('Database initialized at:', dbPath);
            log.info('Database object type:', typeof db);
            log.info('Database is ready:', !!db);

            // Check settings table
            if (db) {
                try {
                    const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get() as any;
                    console.log('Settings row count:', settingsCount.count);
                    if (settingsCount.count > 0) {
                        const settings = db.prepare('SELECT * FROM settings LIMIT 1').get();
                        console.log('Current settings data:', settings);
                    } else {
                        console.log('No settings row found');
                    }
                } catch (error) {
                    console.log('Error checking settings:', error instanceof Error ? error.message : error);
                }
            }

            return db;
        } catch (error) {
            log.error('Failed to initialize database:', error);
            log.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
            console.error('CRITICAL: Database initialization failed:', error);
            console.error('Error message:', error instanceof Error ? error.message : error);
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
            log.warn('Running without database. Some features may not work properly.');
            return null;
        }
    } catch (criticalError) {
        log.error('CRITICAL TOP-LEVEL INITIALIZATION FAILURE:', criticalError);
        return null;
    }
}

/**
 * Create the main application window
 */
async function createWindow() {
    const iconPath = !isDev
        ? path.join(_dirname, 'renderer/Copilot_20260101_152954.png')
        : path.join(_dirname, '../client/public/Copilot_20260101_152954.png');
    log.info('Window icon path:', iconPath);
    log.info('Icon file exists:', fs.existsSync(iconPath));

    mainWindow = new BrowserWindow({
        fullscreen: true,
        kiosk: false, // Allow exiting fullscreen with F11
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            sandbox: true, // ENABLED: Enhanced security
            allowRunningInsecureContent: false,
            // Additional security enhancements
            disableBlinkFeatures: 'Auxclick', // Disable auxiliary mouse buttons
            spellcheck: false, // Disable spellcheck for security
        },
        icon: iconPath,
    });

    // Set Content Security Policy to prevent unsafe-eval and restrict content
    const devServerPort = process.env.VITE_DEV_SERVER_PORT || '5173';
    const devServerUrl = `http://localhost:${devServerPort}`;

    const csp = isDev
        ? `default-src 'self' ${devServerUrl}; script-src 'self' ${devServerUrl} 'unsafe-inline' blob:; worker-src 'self' ${devServerUrl} blob:; style-src 'self' ${devServerUrl} 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ${devServerUrl} http://localhost:5001 ws://localhost:${devServerPort} http://localhost:5001; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';`
        : "default-src 'self' file: blob:; script-src 'self' 'unsafe-inline' file: blob:; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' file:; img-src 'self' file: data: blob:; connect-src 'self' file: blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';";

    log.info('Setting CSP:', csp);

    mainWindow!.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [csp]
            }
        });
    });

    const startUrl = isDev
        ? devServerUrl
        : path.join(_dirname, 'renderer/index.html');

    log.info(`Loading app from: ${startUrl}`);
    log.info(`_dirname: ${_dirname}`);
    log.info(`process.cwd(): ${process.cwd()}`);
    log.info(`app.getAppPath(): ${app.getAppPath()}`);
    log.info(`File exists at startUrl: ${fs.existsSync(isDev ? '' : startUrl)}`);

    // Additional debugging for production builds
    if (!isDev) {
        const rendererPath = path.join(_dirname, 'renderer');
        const indexPath = path.join(rendererPath, 'index.html');
        log.info(`Renderer directory exists: ${fs.existsSync(rendererPath)}`);
        log.info(`Index file exists: ${fs.existsSync(indexPath)}`);
        log.info(`Full index path: ${indexPath}`);

        // List contents of renderer directory
        try {
            const rendererFiles = fs.readdirSync(rendererPath);
            log.info(`Renderer directory contents: ${JSON.stringify(rendererFiles)}`);
        } catch (err) {
            log.error('Failed to read renderer directory:', err);
        }
    }

    // Enhanced error handling
    (mainWindow!.webContents as any).on('did-fail-load', (_event: any, errorCode: number, errorDescription: string, validatedURL: string, isMainFrame: boolean) => {
        log.error(`=== FAILED TO LOAD ===`);
        log.error(`URL: ${validatedURL}`);
        log.error(`Error code: ${errorCode} (${errorDescription}) - type: ${typeof errorCode}`);
        log.error(`Is main frame: ${isMainFrame}`);
        log.error(`Start URL was: ${startUrl}`);
    });

    mainWindow!.webContents.on('did-finish-load', () => {
        log.info('Page finished loading successfully');
    });

    mainWindow!.webContents.on('did-start-loading', () => {
        log.info('Page started loading');
    });

    (mainWindow!.webContents as any).on('render-process-gone', (_event: any, details: Electron.RenderProcessGoneDetails) => {
        log.error(`Renderer process gone. Reason: ${details.reason}, exitCode: ${details.exitCode}`);
    });

    // Catch JavaScript errors in the renderer process
    (mainWindow!.webContents as any).on('console-message', (_event: any, level: number, message: string, line: number, sourceId: string) => {
        const levelNames = ['verbose', 'info', 'warning', 'error'];
        const levelName = levelNames[level] || 'unknown';
        log.info(`Renderer console [${levelName}]: ${message} (${sourceId}:${line})`);

        // Also show errors prominently
        if (level >= 2) { // warning or error
            log.error(`RENDERER ${levelName.toUpperCase()}: ${message}`);
        }
    });

    try {
        if (isDev) {
            log.info('Loading development URL...');
            await mainWindow!.loadURL(startUrl);
            log.info('Development URL loaded successfully');
        } else {
            log.info('Loading production file...');
            log.info(`Attempting to load: ${startUrl}`);

            // Try multiple approaches for loading the file
            try {
                // Method 1: Using pathToFileURL (Node.js built-in)
                const fileUrl = pathToFileURL(startUrl).href;
                log.info(`Method 1 - Original path: ${startUrl}`);
                log.info(`Method 1 - Converted to URL: ${fileUrl}`);
                await mainWindow!.loadURL(fileUrl);
                log.info('Method 1 - Production file loaded successfully');
            } catch (method1Error) {
                log.warn('Method 1 failed, trying Method 2:', method1Error);

                try {
                    // Method 2: Manual file:// URL construction
                    const normalizedPath = path.normalize(startUrl);
                    const manualFileUrl = `file:///${normalizedPath.replace(/\\/g, '/')}`;
                    log.info(`Method 2 - Normalized path: ${normalizedPath}`);
                    log.info(`Method 2 - Manual URL: ${manualFileUrl}`);
                    await mainWindow!.loadURL(manualFileUrl);
                    log.info('Method 2 - Production file loaded successfully');
                } catch (method2Error) {
                    log.warn('Method 2 failed, trying Method 3:', method2Error);

                    // Method 3: Direct loadFile (fallback)
                    log.info('Method 3 - Using loadFile fallback');
                    await mainWindow!.loadFile(startUrl);
                    log.info('Method 3 - Production file loaded successfully');
                }
            }
        }
    } catch (error) {
        log.error(`=== LOAD ERROR ===`);
        log.error(`Failed to load ${isDev ? 'URL' : 'file'} ${startUrl}:`, error);
        console.log('DEBUG: Error type:', typeof error, 'instanceof Error:', error instanceof Error);
        log.error(`Error type: ${error instanceof Error ? error.constructor.name : 'Unknown'}`);
        log.error(`Stack trace: ${error instanceof Error ? error.stack : 'No stack available'}`);

        // Try fallback approach
        if (!isDev) {
            log.info('Trying fallback loadFile approach...');
            try {
                await mainWindow!.loadFile(startUrl);
                log.info('Fallback loadFile succeeded');
            } catch (fallbackError) {
                log.error('Fallback loadFile also failed:', fallbackError);
                throw fallbackError;
            }
        } else {
            throw error;
        }
    }

    // Only open dev tools in development
    if (isDev) {
        mainWindow!.webContents.openDevTools();
    }
    mainWindow!.on('closed', () => {
        mainWindow = null;
    });
}

/**
 * Initialize IPC handlers for communication between renderer and main process
 * These now connect directly to the SQLite database instead of an Express server
 */
function setupIpcHandlers() {
    // Helper function to convert snake_case to camelCase
    const snakeToCamel = (str: string) => {
        return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    };

    // Helper function to convert database row snake_case keys to camelCase
    const transformRow = (row: any): any => {
        if (!row || typeof row !== 'object') return row;
        const result: any = {};
        for (const [key, value] of Object.entries(row)) {
            let processedValue = value;
            // Automatically convert numeric timestamps to ISO strings for the frontend
            if ((key === 'created_at' || key === 'updated_at' || key === 'last_login') && (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value))))) {
                const numericValue = Number(value);
                // Heuristic: if it's < 10^11, it's probably seconds. If > 10^12, milliseconds.
                const ms = numericValue < 10000000000 ? numericValue * 1000 : numericValue;
                processedValue = new Date(ms).toISOString();
            }
            result[snakeToCamel(key)] = processedValue;

            // Special handling for orders: parse items JSON and provide as orderItems
            // This ensures compatibility with frontend components expecting OrderWithItems
            if (key === 'items' && typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
                try {
                    result['orderItems'] = JSON.parse(value);
                } catch (e) {
                    log.warn('Failed to parse items column as JSON:', e);
                }
            }
        }
        return result;
    };

    // Helper function to transform array of rows
    const transformRows = (rows: any[]): any[] => {
        if (!Array.isArray(rows)) return [];
        return rows.map(transformRow);
    };

    // Get app user data path
    ipcMain.handle('get-app-path', async () => {
        return app.getPath('userData');
    });

    // Health check for database
    ipcMain.handle('db:health-check', async () => {
        return {
            initialized: !!db,
            path: db ? (db as any).name : 'none',
            error: !db ? 'Database not initialized' : null
        };
    });

    // Database operations for orders
    ipcMain.handle('db:orders:get-all', async () => {
        if (!db) throw new Error('Database not initialized');
        const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
        return transformRows(rows);
    });

    ipcMain.handle('db:orders:get-by-id', async (_event: any, id: number) => {
        if (!db) throw new Error('Database not initialized');
        const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
        return transformRow(row);
    });

    ipcMain.handle('db:orders:get-by-date-range', async (_event: any, startDate: string, endDate: string) => {
        if (!db) throw new Error('Database not initialized');
        // Format the end date to include the full end day (23:59:59)
        const formattedEndDate = endDate + ' 23:59:59';

        // Support both numeric timestamps (seconds) and ISO strings
        const startTimestamp = Math.floor(new Date(startDate + 'T00:00:00').getTime() / 1000);
        const endTimestamp = Math.floor(new Date(formattedEndDate).getTime() / 1000);
        const startISO = new Date(startDate + 'T00:00:00').toISOString();
        const endISO = new Date(formattedEndDate).toISOString();

        log.info('getOrdersByDateRange called with:', { startDate, endDate, formattedEndDate, startTimestamp, endTimestamp, startISO, endISO });

        const results = db.prepare(`
            SELECT o.*, u.name as userName, u.role as userRole 
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE (typeof(o.created_at) = 'integer' AND o.created_at >= ? AND o.created_at <= ?)
               OR (typeof(o.created_at) = 'text' AND o.created_at >= ? AND o.created_at <= ?)
            ORDER BY o.created_at DESC
        `).all(startTimestamp, endTimestamp, startISO, endISO);

        log.info('Query results count:', results.length);
        if (results.length > 0) {
            log.info('First result created_at:', (results[0] as any).created_at);
            log.info('Last result created_at:', (results[results.length - 1] as any).created_at);
        }

        return transformRows(results);
    });

    ipcMain.handle('db:orders:create', async (_event: any, orderData: any) => {
        if (!db) throw new Error('Database not initialized');
        const { items, total, paymentMethod, customerId, userId, source, status, notes, cashReceived, change, discount } = orderData;

        const stmt = db.prepare(`
            INSERT INTO orders (items, total, payment_method, customer_id, user_id, source, status, notes, cash_received, change, discount, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const info = stmt.run(
            typeof items === 'string' ? items : JSON.stringify(items),
            String(total),
            paymentMethod || null,
            customerId !== undefined && customerId !== null ? Number(customerId) : null,
            userId !== undefined && userId !== null ? Number(userId) : null,
            source || 'pos',
            status || 'completed',
            notes || null,
            cashReceived !== undefined && cashReceived !== null ? String(cashReceived) : null,
            change !== undefined && change !== null ? String(change) : null,
            discount !== undefined && discount !== null ? String(discount) : '0',
            Math.floor(Date.now() / 1000)
        );

        // Update customer loyalty points if customer is associated
        let loyaltyUpdate = null;
        if (customerId && customerId !== null) {
            try {
                const customer = db.prepare('SELECT loyalty_points, total_spent FROM customers WHERE id = ?').get(customerId) as any;
                if (customer) {
                    // Calculate new loyalty points (1 point per R10 spent)
                    const orderAmount = parseFloat(String(total));
                    const pointsEarned = Math.floor(orderAmount / 10);
                    const newLoyaltyPoints = (customer.loyalty_points || 0) + pointsEarned;

                    // Calculate new total spent
                    const currentTotal = parseFloat(customer.total_spent || '0');
                    const newTotalSpent = (currentTotal + orderAmount).toFixed(2);

                    // Update customer
                    const updateStmt = db.prepare(`
                        UPDATE customers
                        SET loyalty_points = ?, total_spent = ?
                        WHERE id = ?
                    `);

                    updateStmt.run(newLoyaltyPoints, newTotalSpent, customerId);

                    loyaltyUpdate = {
                        loyaltyPoints: newLoyaltyPoints,
                        totalSpent: newTotalSpent,
                        pointsEarned
                    };
                }
            } catch (error) {
                log.warn('Failed to update customer loyalty points:', error);
                // Don't fail the order creation if loyalty update fails
            }
        }

        return { id: info.lastInsertRowid, ...orderData, loyaltyUpdate };
    });

    ipcMain.handle('db:orders:bulk-import', async (_event: any, orders: any[]) => {
        if (!db) throw new Error('Database not initialized');

        const results = [];
        const errors = [];

        for (let i = 0; i < orders.length; i++) {
            const orderData = orders[i];
            try {
                const { items, total, paymentMethod, customerId, userId, source, status, notes, cashReceived, change, discount, createdAt } = orderData;

                const stmt = db.prepare(`
                    INSERT INTO orders (items, total, payment_method, customer_id, user_id, source, status, notes, cash_received, change, discount, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);

                const info = stmt.run(
                    typeof items === 'string' ? items : JSON.stringify(items),
                    String(total),
                    paymentMethod || null,
                    customerId !== undefined && customerId !== null ? Number(customerId) : null,
                    userId !== undefined && userId !== null ? Number(userId) : null,
                    source || 'pos',
                    status || 'completed',
                    notes || null,
                    cashReceived !== undefined && cashReceived !== null ? String(cashReceived) : null,
                    change !== undefined && change !== null ? String(change) : null,
                    discount !== undefined && discount !== null ? String(discount) : '0',
                    createdAt ? (typeof createdAt === 'number' ? createdAt : Math.floor(new Date(createdAt).getTime() / 1000)) : Math.floor(Date.now() / 1000)
                );

                results.push({ id: info.lastInsertRowid, ...orderData });
            } catch (error) {
                errors.push({ index: i, error: error instanceof Error ? error.message : String(error) });
            }
        }

        return { imported: results.length, errors };
    });

    ipcMain.handle('db:orders:void-order', async (_event: any, { orderId, userId: _userId, reason }: { orderId: number; userId: number; reason?: string }) => {
        if (!db) throw new Error('Database not initialized');
        if (!currentUserId) throw new Error('Unauthorized: No active session');

        // Get the order to check it exists and is not already voided
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
        if (!order) {
            throw new Error('Order not found');
        }
        if (order.status === 'voided') {
            throw new Error('Order is already voided');
        }

        // Store before state for audit log
        const beforeState = JSON.stringify(order);

        // Update order status to voided
        const updateStmt = db.prepare('UPDATE orders SET status = ? WHERE id = ?');
        const updateResult = updateStmt.run('voided', orderId);

        if (updateResult.changes === 0) {
            throw new Error('Failed to void order');
        }

        // Get updated order for audit log
        const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
        const afterState = JSON.stringify(updatedOrder);

        // Create audit log entry
        const auditStmt = db.prepare(`
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value, reason, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        auditStmt.run(
            currentUserId,
            'void',
            'order',
            orderId,
            beforeState,
            afterState,
            reason || null,
            Math.floor(Date.now() / 1000)
        );

        return { success: true, orderId };
    });

    ipcMain.handle('db:orders:void-items', async (_event: any, { itemIds, userId: _userId, reason }: { itemIds: number[]; userId: number; reason?: string }) => {
        if (!db) throw new Error('Database not initialized');
        if (!currentUserId) throw new Error('Unauthorized: No active session');

        // Validate input
        if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
            throw new Error('Item IDs array is required and cannot be empty');
        }

        // Find orders that contain these item IDs
        const orders = db.prepare('SELECT * FROM orders WHERE status = ?').all('completed') as any[];
        let targetOrder = null;
        let orderItems = null;

        // Helper to get the ID from an item object
        const getItemId = (item: any) => {
            const id = item.productId || item.product?.id || item.id;
            return id ? String(id) : null;
        };

        const targetItemIds = itemIds.map(String);

        for (const order of orders) {
            try {
                const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                const itemIdsInOrder = items.map((item: any) => getItemId(item)).filter(Boolean);
                const hasAllItems = targetItemIds.every(id => itemIdsInOrder.includes(id));

                if (hasAllItems) {
                    if (targetOrder) {
                        log.warn('Items belong to multiple orders, choosing most recent');
                    }
                    targetOrder = order;
                    orderItems = items;
                }
            } catch (e) {
                log.warn('Failed to parse items for order', order.id, e);
            }
        }

        if (!targetOrder) {
            throw new Error('No order found containing all specified items. Please ensure you are selecting items from the same order.');
        }

        // Check that none of the items are already voided
        const voidedItems = orderItems.filter((item: any) => item.voided);
        const voidedItemIds = voidedItems.map((item: any) => getItemId(item)).filter(Boolean);
        const alreadyVoided = targetItemIds.filter(id => voidedItemIds.includes(id));

        if (alreadyVoided.length > 0) {
            throw new Error(`Some items are already voided: ${alreadyVoided.join(', ')}`);
        }

        // Update voided status for specified items
        let totalReduction = 0;
        const updatedItems = orderItems.map((item: any) => {
            const itemId = getItemId(item);
            if (itemId && targetItemIds.includes(itemId)) {
                if (item.voided) return item; // Already voided, don't reduce again

                // Detect the most accurate price used in this item
                const priceValue = parseFloat(item.discountedPrice || item.price || item.product?.price || '0');
                const quantity = item.quantity || 1;
                const itemTotal = priceValue * quantity;

                totalReduction += itemTotal;
                return { ...item, voided: true };
            }
            return item;
        });

        // Recalculate order total
        const originalTotal = parseFloat(targetOrder.total || '0');
        const newTotal = Math.max(0, originalTotal - totalReduction).toFixed(2);

        // Store before state for audit log
        const beforeState = JSON.stringify(targetOrder);

        // Update order
        const updateStmt = db.prepare('UPDATE orders SET items = ?, total = ? WHERE id = ?');
        const updateResult = updateStmt.run(JSON.stringify(updatedItems), newTotal, targetOrder.id);

        if (updateResult.changes === 0) {
            throw new Error('Failed to update order');
        }

        // Get updated order
        const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(targetOrder.id) as any;
        const afterState = JSON.stringify(updatedOrder);

        // Create audit log entries for each voided item
        const auditStmt = db.prepare(`
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value, reason, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const itemId of itemIds) {
            auditStmt.run(
                currentUserId,
                'void_item',
                'order_item',
                targetOrder.id,
                `item_id: ${itemId}`,
                `item_id: ${itemId}, voided: true`,
                reason || null,
                Math.floor(Date.now() / 1000)
            );
        }

        // Also log the order total change
        if (totalReduction > 0) {
            auditStmt.run(
                currentUserId,
                'update_total',
                'order',
                targetOrder.id,
                beforeState,
                afterState,
                `Voided items, total reduced by ${totalReduction.toFixed(2)}`,
                Math.floor(Date.now() / 1000)
            );
        }

        return { success: true, order: updatedOrder };
    });

    ipcMain.handle('db:auth:verify-admin-pin', async (_event: any, { userId, pin }: { userId: number; pin: string }) => {
        if (!db) throw new Error('Database not initialized');

        // Get user by ID
        const user = db.prepare('SELECT id, pin, role FROM users WHERE id = ?').get(userId) as any;
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return { success: false, error: 'User is not an admin' };
        }

        // Verify PIN
        if (user.pin !== pin) {
            return { success: false, error: 'Invalid PIN' };
        }

        return { success: true };
    });

    // Database operations for products
    ipcMain.handle('db:products:get-all', async () => {
        if (!db) {
            log.warn('Database not initialized, returning empty products list');
            return [];
        }
        const products = db.prepare('SELECT * FROM products ORDER BY name').all();
        return transformRows(products);
    });

    secureDatabaseHandler('db:products:get-by-id', async (_event: any, data: { id: number }) => {
        if (!db) throw new Error('Database not initialized');
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(data.id);
        return transformRow(product);
    }, ProductIdSchema);

    secureDatabaseHandler('db:products:get-by-barcode', async (_event: any, data: { barcode: string }) => {
        if (!db) throw new Error('Database not initialized');
        const product = db.prepare('SELECT * FROM products WHERE barcode = ?').get(data.barcode);
        return transformRow(product);
    }, z.object({ barcode: z.string().min(1) }));

    secureDatabaseHandler('db:products:create', async (_event: any, productData: any) => {
        if (!db) throw new Error('Database not initialized');
        const { name, price, cost, image, stockQuantity, barcode, plu, category, categoryId } = productData;

        const stmt = db.prepare(`
            INSERT INTO products (name, price, cost, image, stock_quantity, barcode, plu, category, category_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const info = stmt.run(
            name,
            price.toString(),
            cost ? cost.toString() : '0',
            image,
            parseInt(stockQuantity) || 0,
            barcode,
            plu || null,
            category || 'General',
            categoryId || null
        );

        return { id: info.lastInsertRowid, ...productData };
    }, ProductSchema);

    ipcMain.handle('db:products:update', async (_event: any, id: number, updates: any) => {
        if (!db) throw new Error('Database not initialized');

        // Build dynamic update query with type conversions
        const processedUpdates: Record<string, any> = {};
        const updateFields = [];
        const values = [];

        for (const key in updates) {
            const value = updates[key];
            if (value === undefined) continue; // Skip undefined values

            let processedValue;
            if (typeof value === 'boolean') {
                processedValue = value ? 1 : 0;
            } else if (value && typeof value === 'object') {
                processedValue = JSON.stringify(value);
            } else if (key === 'price' || key === 'cost') {
                processedValue = String(value);
            } else if (key === 'stockQuantity') {
                processedValue = Number(value) || 0;
            } else {
                processedValue = value;
            }
            processedUpdates[key] = processedValue;
            updateFields.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = ?`);
            values.push(processedValue);
        }

        if (updateFields.length === 0) {
            throw new Error('No valid fields to update');
        }

        const query = `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`;
        const stmt = db.prepare(query);
        stmt.run(...values, Number(id));

        // Return the actual updated product from the database
        const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(id));
        return transformRow(updatedProduct);
    });

    ipcMain.handle('db:products:delete', async (_event: any, id: number) => {
        if (!db) throw new Error('Database not initialized');
        const stmt = db.prepare('DELETE FROM products WHERE id = ?');
        const info = stmt.run(id);
        return { rowsAffected: info.changes };
    });

    // Database operations for customers
    ipcMain.handle('db:customers:get-all', async () => {
        if (!db) {
            log.warn('Database not initialized, returning empty customers list');
            return [];
        }
        const rows = db.prepare('SELECT * FROM customers ORDER BY name').all();
        return transformRows(rows);
    });

    ipcMain.handle('db:customers:create', async (_event: any, customerData: any) => {
        if (!db) throw new Error('Database not initialized');
        const { name, email, phone } = customerData;

        // Validate input
        if (!name || name.trim().length === 0) {
            throw new Error('Customer name is required');
        }

        // Email validation
        if (email && email.trim().length > 0) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Invalid email format');
            }
        }

        // Phone validation
        if (phone && phone.trim().length > 0) {
            const phoneRegex = /^[0-9+\-\(\)\s]+$/;
            if (!phoneRegex.test(phone)) {
                throw new Error('Invalid phone number format');
            }
        }

        // Check for duplicates
        if (email) {
            const existingEmail = db.prepare('SELECT id FROM customers WHERE email = ?').get(email);
            if (existingEmail) {
                throw new Error('A customer with this email already exists');
            }
        }

        if (phone) {
            const existingPhone = db.prepare('SELECT id FROM customers WHERE phone = ?').get(phone);
            if (existingPhone) {
                throw new Error('A customer with this phone number already exists');
            }
        }

        const stmt = db.prepare(`
            INSERT INTO customers (name, email, phone)
            VALUES (?, ?, ?)
        `);

        const info = stmt.run(name.trim(), email || null, phone || null);

        return { id: info.lastInsertRowid, ...customerData };
    });

    ipcMain.handle('db:customers:get-by-id', async (_event: any, id: number) => {
        if (!db) throw new Error('Database not initialized');
        const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
        return transformRow(row);
    });

    ipcMain.handle('db:customers:update', async (_event: any, id: number, updates: any) => {
        if (!db) throw new Error('Database not initialized');
        const { name, email, phone } = updates;

        // Validate input
        if (name !== undefined && (!name || name.trim().length === 0)) {
            throw new Error('Customer name cannot be empty');
        }

        // Email validation
        if (email !== undefined && email && email.trim().length > 0) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Invalid email format');
            }
        }

        // Phone validation
        if (phone !== undefined && phone && phone.trim().length > 0) {
            const phoneRegex = /^[0-9+\-\(\)\s]+$/;
            if (!phoneRegex.test(phone)) {
                throw new Error('Invalid phone number format');
            }
        }

        // Check for duplicates (excluding current customer)
        if (email !== undefined && email) {
            const existingEmail = db.prepare('SELECT id FROM customers WHERE email = ? AND id != ?').get(email, id);
            if (existingEmail) {
                throw new Error('A customer with this email already exists');
            }
        }

        if (phone !== undefined && phone) {
            const existingPhone = db.prepare('SELECT id FROM customers WHERE phone = ? AND id != ?').get(phone, id);
            if (existingPhone) {
                throw new Error('A customer with this phone number already exists');
            }
        }

        // Build dynamic update query
        const updateFields = [];
        const values = [];

        if (name !== undefined) {
            updateFields.push('name = ?');
            values.push(name.trim());
        }
        if (email !== undefined) {
            updateFields.push('email = ?');
            values.push(email || null);
        }
        if (phone !== undefined) {
            updateFields.push('phone = ?');
            values.push(phone || null);
        }

        if (updateFields.length === 0) {
            throw new Error('No valid fields to update');
        }

        const query = `UPDATE customers SET ${updateFields.join(', ')} WHERE id = ?`;
        values.push(id);

        const stmt = db.prepare(query);
        const result = stmt.run(...values);

        if (result.changes === 0) {
            throw new Error('Customer not found');
        }

        return { id, ...updates };
    });

    ipcMain.handle('db:customers:delete', async (_event: any, id: number) => {
        if (!db) throw new Error('Database not initialized');

        // Check if customer has orders
        const orders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE customer_id = ?').get(id) as any;
        if (orders.count > 0) {
            throw new Error('Cannot delete customer with existing orders. Consider marking as inactive instead.');
        }

        const stmt = db.prepare('DELETE FROM customers WHERE id = ?');
        const result = stmt.run(id);

        if (result.changes === 0) {
            throw new Error('Customer not found');
        }

        return { rowsAffected: result.changes };
    });

    ipcMain.handle('db:customers:search', async (_event: any, searchTerm: string, limit: number = 50) => {
        if (!db) throw new Error('Database not initialized');

        const searchPattern = `%${searchTerm}%`;
        const rows = db.prepare(`
            SELECT * FROM customers 
            WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?
            ORDER BY name 
            LIMIT ?
        `).all(searchPattern, searchPattern, searchPattern, limit);
        return transformRows(rows);
    });

    ipcMain.handle('db:customers:update-loyalty', async (_event: any, customerId: number, orderTotal: string) => {
        if (!db) throw new Error('Database not initialized');

        // Get current loyalty points and total spent
        const customer = db.prepare('SELECT loyalty_points, total_spent FROM customers WHERE id = ?').get(customerId);
        if (!customer) {
            throw new Error('Customer not found');
        }

        // Calculate new loyalty points (1 point per R10 spent)
        const orderAmount = parseFloat(orderTotal);
        const pointsEarned = Math.floor(orderAmount / 10);
        const newLoyaltyPoints = (customer as any).loyalty_points + pointsEarned;

        // Calculate new total spent
        const currentTotal = parseFloat((customer as any).total_spent || '0');
        const newTotalSpent = (currentTotal + orderAmount).toFixed(2);

        // Update customer
        const stmt = db.prepare(`
            UPDATE customers 
            SET loyalty_points = ?, total_spent = ? 
            WHERE id = ?
        `);

        stmt.run(newLoyaltyPoints, newTotalSpent, customerId);

        return {
            loyaltyPoints: newLoyaltyPoints,
            totalSpent: newTotalSpent,
            pointsEarned
        };
    });

    // Database operations for categories
    ipcMain.handle('db:categories:get-all', async () => {
        if (!db) throw new Error('Database not initialized');
        return db.prepare('SELECT * FROM categories ORDER BY name').all();
    });

    ipcMain.handle('db:categories:create', async (_event: any, categoryData: any) => {
        if (!db) throw new Error('Database not initialized');
        const { name, description } = categoryData;

        const stmt = db.prepare(`
            INSERT INTO categories (name, description)
            VALUES (?, ?)
        `);

        const info = stmt.run(name, description);

        return { id: info.lastInsertRowid, ...categoryData };
    });

    ipcMain.handle('db:categories:update', async (_event: any, id: number, updates: any) => {
        if (!db) throw new Error('Database not initialized');

        // Check if category exists
        const currentCategory = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;
        if (!currentCategory) {
            throw new Error('Category not found');
        }

        // Validate name uniqueness
        if (updates.name !== undefined) {
            const conflicting = db.prepare('SELECT id FROM categories WHERE name = ? AND id != ?').get(updates.name, id);
            if (conflicting && currentCategory.name !== 'General') {
                throw new Error('A category with this name already exists');
            }
        }

        // Build dynamic update query with type conversions
        const updateFields = [];
        const values = [];

        for (const key in updates) {
            const value = updates[key];
            if (value === undefined) continue; // Skip undefined values

            let processedValue;
            if (typeof value === 'boolean') {
                processedValue = value ? 1 : 0;
            } else if (value && typeof value === 'object') {
                processedValue = JSON.stringify(value);
            } else {
                processedValue = value;
            }
            updateFields.push(`${key} = ?`);
            values.push(processedValue);
        }

        if (updateFields.length === 0) {
            throw new Error('No valid fields to update');
        }

        const query = `UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`;
        const stmt = db.prepare(query);
        stmt.run(...values, Number(id));

        return { id, ...updates };
    });

    ipcMain.handle('db:categories:delete', async (_event: any, id: number) => {
        if (!db) throw new Error('Database not initialized');

        // Get category to check name
        const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;
        if (!category) {
            throw new Error('Category not found');
        }

        if (category.name === 'General') {
            throw new Error('Cannot delete the default General category');
        }

        // Use transaction for data integrity
        const transaction = db.transaction(() => {
            // TypeScript null safety: db is checked outside but re-check for safety
            if (!db) throw new Error('Database not initialized in transaction');

            // Find or create the 'General' category
            let generalCategory = db!.prepare('SELECT * FROM categories WHERE name = ?').get('General') as any;
            if (!generalCategory) {
                const insertStmt = db!.prepare(`
                    INSERT INTO categories (name, description)
                    VALUES (?, ?)
                `);
                const info = insertStmt.run('General', 'Default category for products');
                generalCategory = {
                    id: info.lastInsertRowid,
                    name: 'General',
                    description: 'Default category for products',
                    createdAt: new Date().toISOString()
                };
            }

            // Update all products with this categoryId to the 'General' category
            db!.prepare('UPDATE products SET category_id = ? WHERE category_id = ?').run(generalCategory.id, id);

            // Delete the category
            const deleteStmt = db!.prepare('DELETE FROM categories WHERE id = ?');
            const info = deleteStmt.run(id);

            return { rowsAffected: info.changes };
        });

        return transaction();
    });

    // Database operations for discounts
    ipcMain.handle('db:discounts:get-all', async () => {
        if (!db) throw new Error('Database not initialized');
        return db.prepare('SELECT * FROM discounts WHERE active = 1 ORDER BY name').all();
    });

    // Database operations for settings
    ipcMain.handle('db:settings:get', async () => {
        if (!db) {
            log.warn('Database not initialized, returning default settings');
            // Return default settings when database is not available
            return {
                id: 1,
                storeName: 'OpenSauce P.O.S.',
                currency: 'R',
                theme: 'light',
                language: 'en',
                deviceRole: 'standalone',
                createdAt: Math.floor(Date.now() / 1000),
                updatedAt: Math.floor(Date.now() / 1000)
            };
        }
        let settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
        if (!settings) {
            db.prepare('INSERT INTO settings (id) VALUES (1)').run();
            settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
        }

        // Transform database row for frontend
        return transformRow(settings);
    });

    ipcMain.handle('db:settings:update', async (_event: any, updates: any) => {
        if (!db) throw new Error('Database not initialized');
        checkAdmin();

        // Check if settings row exists, insert default if not
        const existing = db.prepare('SELECT id FROM settings WHERE id = 1').get();
        if (!existing) {
            db.prepare('INSERT INTO settings (id) VALUES (1)').run();
        }

        // Convert boolean values to integers and objects/arrays to JSON strings for SQLite compatibility
        const processedUpdates: Record<string, any> = {};
        for (const key in updates) {
            const value = updates[key];
            if (typeof value === 'boolean') {
                processedUpdates[key] = value ? 1 : 0;
            } else if (value && typeof value === 'object') {
                processedUpdates[key] = JSON.stringify(value);
            } else {
                processedUpdates[key] = value;
            }
        }

        // Convert keys to snake_case and filter against allowlist to prevent SQL errors
        const allowedColumns = [
            'store_name', 'store_address', 'store_phone', 'store_email', 'store_logo',
            'currency', 'printer_name', 'printer_type', 'printer_ip', 'printer_device_id',
            'scanner_device_id', 'scanner_com_port', 'scanner_type',
            'camera_device_id', 'camera_scanner_enabled', 'camera_facing', 'camera_resolution',
            'camera_torch_enabled', 'camera_continuous_scan', 'camera_supported_formats',
            'cash_drawer_port', 'cash_drawer_pulse',
            'customer_display_type', 'customer_display_value', 'enable_customer_display', 'enable_bluetooth_peripherals',
            'scale_port', 'scale_device_id',
            'receipt_width', 'receipt_custom_width', 'receipt_header_text', 'receipt_footer_text', 'receipt_font_size',
            'receipt_show_logo', 'receipt_show_order_number', 'receipt_show_date', 'receipt_show_customer',
            'receipt_show_payment_method', 'receipt_show_barcode', 'receipt_show_qr_code',
            'qr_code_scale', 'receipt_logo_scale', 'payment_qr_code',
            'theme', 'language', 'device_role', 'server_ip_address',
            'auto_backup_enabled', 'backup_frequency', 'backup_location',
            'session_timeout', 'password_min_length', 'password_require_special',
            'low_stock_threshold', 'stock_alert_enabled',
            'audit_logging_enabled', 'audit_log_level',
            'tax_rate', 'vat_percentage', 'vat_number',
            'advice_list', 'auto_launch_enabled',
            'whatsapp_enabled', 'whatsapp_phone_number', 'whatsapp_api_key', 'whatsapp_business_id', 'whatsapp_send_receipts',
            // Robust Receipt
            'receipt_header_font', 'receipt_header_scale',
            'receipt_items_font', 'receipt_items_scale',
            'receipt_numbers_font', 'receipt_numbers_scale',
            'receipt_details_font', 'receipt_details_scale',
            'receipt_metadata_font', 'receipt_metadata_scale',
            'receipt_divider_opacity', 'receipt_show_item_divider', 'receipt_item_divider_style',
            'receipt_show_total_divider', 'receipt_compact_mode',
            'updated_at' // Always allowed
        ];

        // Helper to convert camelCase to snake_case
        const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

        const bindParams: any[] = [];
        const setClauses: string[] = [];

        Object.entries(processedUpdates).forEach(([key, value]) => {
            let dbColumn = toSnakeCase(key);

            // Manual overrides for specific mismatches
            if (key === 'autoBackupEnabled') dbColumn = 'auto_backup_enabled';
            if (key === 'backupFrequency') dbColumn = 'backup_frequency';
            if (key === 'backupLocation') dbColumn = 'backup_location';
            if (key === 'sessionTimeout') dbColumn = 'session_timeout';
            if (key === 'passwordMinLength') dbColumn = 'password_min_length';
            if (key === 'passwordRequireSpecial') dbColumn = 'password_require_special';
            if (key === 'lowStockThreshold') dbColumn = 'low_stock_threshold';
            if (key === 'stockAlertEnabled') dbColumn = 'stock_alert_enabled';
            if (key === 'auditLoggingEnabled') dbColumn = 'audit_logging_enabled';
            if (key === 'auditLogLevel') dbColumn = 'audit_log_level';
            if (key === 'autoLaunchEnabled') dbColumn = 'auto_launch_enabled';
            if (key === 'cameraScannerEnabled') dbColumn = 'camera_scanner_enabled';
            if (key === 'cameraTorchEnabled') dbColumn = 'camera_torch_enabled';
            if (key === 'cameraFacing') dbColumn = 'camera_facing';
            if (key === 'cameraResolution') dbColumn = 'camera_resolution';
            if (key === 'cameraDeviceId') dbColumn = 'camera_device_id';
            if (key === 'printerDeviceId') dbColumn = 'printer_device_id';
            if (key === 'printerIp') dbColumn = 'printer_ip';
            if (key === 'scannerDeviceId') dbColumn = 'scanner_device_id';
            if (key === 'scannerComPort') dbColumn = 'scanner_com_port';
            if (key === 'customerDisplayValue') dbColumn = 'customer_display_value';
            if (key === 'scaleDeviceId') dbColumn = 'scale_device_id';

            // Fix specific mapping issues
            if (key === 'cameraContinuousScan' || key === 'cameraContinuousScan') dbColumn = 'camera_continuous_scan';
            if (key === 'cameraSupportedFormats') dbColumn = 'camera_supported_formats';

            if (allowedColumns.includes(dbColumn)) {
                setClauses.push(`${dbColumn} = ?`);
                bindParams.push(value);
            }
        });

        if (setClauses.length === 0) return transformRow(existing); // No valid updates

        // Add updated_at
        setClauses.push(`updated_at = ?`);
        bindParams.push(new Date().toISOString());

        // Add ID for WHERE clause
        bindParams.push(1);

        const sql = `UPDATE settings SET ${setClauses.join(', ')} WHERE id = ?`;

        try {
            db.prepare(sql).run(...bindParams);
        } catch (err) {
            log.error('Failed to update settings:', err);
            throw err; // Allow frontend to see error
        }

        // Handle auto-launch feature in Electron
        if (updates.autoLaunchEnabled !== undefined && !isDev) {
            try {
                log.info(`Setting auto-launch to: ${updates.autoLaunchEnabled}`);
                app.setLoginItemSettings({
                    openAtLogin: updates.autoLaunchEnabled,
                    path: process.execPath, // Explicit path is better on Windows
                });
            } catch (autoLaunchError) {
                log.error('Failed to set login item settings:', autoLaunchError);
            }
        }

        // Fetch the actual updated settings from database
        const updatedSettings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
        return transformRow(updatedSettings);
    });

    // Database operation for factory reset
    ipcMain.handle('db:database:factory-reset', async () => {
        if (!db) throw new Error('Database not initialized');
        // Factory reset is a critical action, requires admin
        checkAdmin();

        try {
            // Get the database file path to backup before reset
            const dbPath = db.name;

            // Create a backup before reset
            const backupPath = `${dbPath}.backup.${Date.now()}`;
            fs.copyFileSync(dbPath, backupPath);

            // Close the current database connection
            db.close();

            // Create a new database instance to ensure no locks
            const newDb = new Database(dbPath);

            // Drop all tables except migrations (to preserve schema)
            const tables = newDb.prepare(`
                SELECT name FROM sqlite_master
                WHERE type='table'
                AND name NOT LIKE 'sqlite_%'
                AND name != '_drizzle_migrations'
                AND name != '_drizzle_migrations_lock'
                AND name != 'users'
            `).all();

            for (const table of tables as Array<{ name: string }>) {
                if (table.name === 'settings') {
                    // For settings, reset to default values instead of deleting
                    newDb.prepare(`
                        UPDATE settings
                        SET store_name = 'New Store',
                            store_address = '',
                            store_phone = '',
                            store_email = '',
                            store_logo = NULL,
                            currency = 'R',
                            printer_name = '',
                            printer_type = 'usb',
                            printer_ip = '',
                            scanner_device_id = '',
                            scanner_com_port = '',
                            camera_device_id = '',
                            camera_scanner_enabled = 0,
                            camera_facing = 'environment',
                            camera_resolution = '1280x720',
                            camera_torch_enabled = 0,
                            camera_continuous_scan = 0,
                            camera_supported_formats = '["code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "qr_code", "pdf_417", "data_matrix", "code_93", "codabar", "itf"]',
                            cash_drawer_port = '',
                            customer_display_type = 'none',
                            customer_display_value = '',
                            scale_port = '',
                            scale_device_id = '',
                            receipt_width = '80mm',
                            receipt_custom_width = 80,
                            receipt_header_text = '',
                            receipt_footer_text = '',
                            receipt_font_size = 'medium',
                            receipt_show_logo = 1,
                            receipt_show_order_number = 1,
                            receipt_show_date = 1,
                            receipt_show_customer = 1,
                            receipt_show_payment_method = 1,
                            receipt_show_barcode = 0,
                            receipt_show_qr_code = 0,
                            payment_qr_code = NULL,
                            whatsapp_enabled = 0,
                            whatsapp_phone_number = '',
                            whatsapp_api_key = '',
                            whatsapp_business_id = '',
                            whatsapp_send_receipts = 0,
                            theme = 'light',
                            language = 'en',
                            device_role = 'standalone',
                            server_ip_address = '',
                            auto_backup_enabled = 1,
                            backup_frequency = 'daily',
                            backup_location = '',
                            session_timeout = 1800,
                            password_min_length = 6,
                            password_require_special = 0,
                            low_stock_threshold = 10,
                            stock_alert_enabled = 1,
                            audit_logging_enabled = 0,
                            audit_log_level = 'info',
                            vat_number = '',
                            advice_list = '[]',
                            updated_at = ?
                    `).run(Math.floor(Date.now() / 1000));
                } else {
                    newDb.prepare(`DELETE FROM ${table.name}`).run();
                }
            }

            // Close the new database connection
            newDb.close();

            // Reopen the original database connection
            db = new Database(dbPath);

            return { success: true, backupPath };
        } catch (error) {
            log.error('Factory reset failed:', error);
            throw error;
        }
    });

    // Database operations for users
    ipcMain.handle('db:users:get-all', async () => {
        if (!db) throw new Error('Database not initialized');
        const rows = db.prepare('SELECT id, name, role, is_owner, created_at, last_login FROM users ORDER BY name').all();
        return transformRows(rows);
    });

    ipcMain.handle('db:auth:login', async (_event: any, pinOrData: string | { pin: string }) => {
        if (!db) throw new Error('Database not initialized');

        // Handle both direct pin string and object with pin property
        let pinStr: string;
        if (typeof pinOrData === 'string') {
            pinStr = pinOrData;
        } else if (typeof pinOrData === 'object' && pinOrData.pin) {
            pinStr = pinOrData.pin;
        } else {
            throw new Error('Invalid PIN format');
        }

        // Ensure pin is a string for database query
        pinStr = String(pinStr);
        const user = db.prepare('SELECT * FROM users WHERE pin = ? LIMIT 1').get(pinStr) as any;

        if (!user) {
            throw new Error('Invalid PIN');
        }

        // Set current user ID for session
        currentUserId = user.id;

        // Update last login
        db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(Math.floor(Date.now() / 1000), user.id);

        // Return user without PIN
        const { pin: _, ...userWithoutPin } = user;
        return { user: transformRow(userWithoutPin) };
    });

    ipcMain.handle('db:auth:check-setup', async () => {
        if (!db) {
            log.error('Database connection missing during setup check');
            throw new Error('DATABASE_CONNECTION_ERROR');
        }
        try {
            const users = db.prepare('SELECT id FROM users LIMIT 1').all();
            return users.length === 0;
        } catch (error) {
            log.error('Error checking user count:', error);
            throw new Error('DATABASE_SCHEMA_ERROR');
        }
    });

    ipcMain.handle('db:auth:setup', async (_event: any, data: any) => {
        if (!db) throw new Error('Database not initialized');

        // Check if any users already exist (setup already completed)
        const existingUsers = db.prepare('SELECT id FROM users LIMIT 1').all();
        if (existingUsers.length > 0) {
            throw new Error('Setup already completed');
        }

        const { name, pin } = data;

        // Validate input
        if (!name || !pin) {
            throw new Error('Name and PIN are required');
        }

        // Validate PIN format
        if (!/^\d{6}$/.test(pin)) {
            throw new Error('PIN must be 6 digits');
        }

        const stmt = db.prepare(`
            INSERT INTO users (name, pin, role, is_owner)
            VALUES (?, ?, ?, ?)
        `);

        const info = stmt.run(String(name), String(pin), 'admin', 1); // is_owner = 1 (true)

        const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(info.lastInsertRowid)) as any;

        // Auto-login the new user
        currentUserId = newUser.id;

        const { pin: _, ...userWithoutPin } = newUser;
        return { user: userWithoutPin };
    });

    ipcMain.handle('db:auth:set-session', async (_event: any, userId: number) => {
        if (!db) throw new Error('Database not initialized');
        currentUserId = userId;
        log.info(`Session set for user ID: ${userId}`);
        return true;
    });

    // Database operations for user preferences
    ipcMain.handle('db:user-preferences:get', async (_event: any, key: string) => {
        if (!db) throw new Error('Database not initialized');
        if (!currentUserId) throw new Error('No user logged in');

        const preference = db.prepare('SELECT preference_value FROM user_preferences WHERE user_id = ? AND preference_key = ?').get(currentUserId, key) as any;
        return preference ? preference.preference_value : null;
    });

    ipcMain.handle('db:user-preferences:set', async (_event: any, data: { key: string; value: string }) => {
        if (!db) throw new Error('Database not initialized');
        if (!currentUserId) throw new Error('No user logged in');

        const { key, value } = data;
        const now = new Date().toISOString();

        // Use INSERT OR REPLACE to handle both insert and update
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO user_preferences (user_id, preference_key, preference_value, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run(currentUserId, key, value, now, now);
        return { key, value };
    });

    // User management functions
    ipcMain.handle('db:users:update', async (_event: any, id: number, updates: any) => {
        if (!db) throw new Error('Database not initialized');
        checkAdmin();

        // Build dynamic update query
        const { name, role } = updates;
        const stmt = db.prepare(`
            UPDATE users
            SET name = COALESCE(?, name),
                role = COALESCE(?, role)
            WHERE id = ?
        `);

        stmt.run(String(name), String(role), Number(id));

        // Return updated user
        const updatedUser = db.prepare('SELECT id, name, role, is_owner as isOwner, created_at as createdAt, last_login as lastLogin FROM users WHERE id = ?').get(Number(id));
        return updatedUser;
    });

    ipcMain.handle('db:users:delete', async (_event: any, id: number) => {
        if (!db) throw new Error('Database not initialized');
        checkAdmin();

        // Don't allow deleting the owner user
        const user = db.prepare('SELECT is_owner FROM users WHERE id = ?').get(Number(id)) as any;
        if (user && user.is_owner) {
            throw new Error('Cannot delete owner user');
        }

        const stmt = db.prepare('DELETE FROM users WHERE id = ?');
        const info = stmt.run(Number(id));

        return { rowsAffected: info.changes };
    });

    ipcMain.handle('db:users:change-pin', async (_event: any, id: number, newPin: string) => {
        if (!db) throw new Error('Database not initialized');
        checkAdmin();

        // Validate PIN format
        if (!/^\d{6}$/.test(newPin)) {
            throw new Error('PIN must be 6 digits');
        }

        const stmt = db.prepare('UPDATE users SET pin = ? WHERE id = ?');
        stmt.run(String(newPin), Number(id));

        // Return updated user info (without PIN)
        const updatedUser = db.prepare('SELECT id, name, role, is_owner as isOwner, created_at as createdAt, last_login as lastLogin FROM users WHERE id = ?').get(Number(id));
        return updatedUser;
    });

    ipcMain.handle('db:users:create', async (_event: any, userData: any) => {
        if (!db) throw new Error('Database not initialized');
        checkAdmin();

        const { name, pin, role } = userData;

        // Validate input
        if (!name || !pin || !role) {
            throw new Error('Name, PIN, and role are required');
        }

        // Validate PIN format
        if (!/^\d{6}$/.test(pin)) {
            throw new Error('PIN must be 6 digits');
        }

        // Validate role
        if (!['admin', 'cashier'].includes(role)) {
            throw new Error('Role must be either "admin" or "cashier"');
        }

        const stmt = db.prepare(`
            INSERT INTO users (name, pin, role, is_owner)
            VALUES (?, ?, ?, ?)
        `);

        const info = stmt.run(String(name), String(pin), String(role), 0); // is_owner = 0 (false) for non-owner users

        const newUser = db.prepare('SELECT id, name, role, is_owner as isOwner, created_at as createdAt, last_login as lastLogin FROM users WHERE id = ?').get(Number(info.lastInsertRowid));
        return newUser;
    });

    // Database operations for cash outs
    ipcMain.handle('db:cash-outs:get-daily-summary', async (_event: any, date: string) => {
        if (!db) throw new Error('Database not initialized');

        // Get start and end of the specified date
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

        // Convert to unix timestamps (seconds) for SQLite comparison if stored as integers
        const startTimestamp = Math.floor(startOfDay.getTime() / 1000);
        const endTimestamp = Math.floor(endOfDay.getTime() / 1000);

        // Get all cash transactions for the day with user info
        // We check both ISO string and unix timestamp to be extremely robust
        const cashOrders = db.prepare(`
            SELECT o.*, u.name as userName, u.role as userRole FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.payment_method = 'cash'
            AND (
                (o.created_at >= ? AND o.created_at <= ?) OR
                (o.created_at >= ? AND o.created_at <= ?)
            )
        `).all(startOfDay.toISOString(), endOfDay.toISOString(), startTimestamp, endTimestamp) as any[];

        // Aggregate by user
        const userAggregates: Record<number, {
            userId: number;
            userName: string;
            userRole: string;
            orderCount: number;
            totalSales: number;
            totalItems: number;
            totalProfit: number;
        }> = {};

        let totalCashReceived = 0;
        let totalChangeGiven = 0;

        // Create a product cost cache to avoid repeated lookups
        const productCostCache: Record<number, number> = {};

        for (const order of cashOrders) {
            const userId = order.user_id || 0;
            const userName = order.userName || 'Unknown User';
            const userRole = order.userRole || '';

            if (!userAggregates[userId]) {
                userAggregates[userId] = {
                    userId,
                    userName,
                    userRole,
                    orderCount: 0,
                    totalSales: 0,
                    totalItems: 0,
                    totalProfit: 0,
                };
            }

            const orderTotal = Number(order.total);
            const cashReceived = Number(order.cash_received || 0);
            const changeGiven = Number(order.change || 0);

            userAggregates[userId].orderCount++;
            userAggregates[userId].totalSales += orderTotal;
            totalCashReceived += cashReceived;
            totalChangeGiven += changeGiven;

            // Parse items and calculate metrics
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            let orderProfit = 0;
            let orderItemsCount = 0;

            for (const item of items) {
                if (item.voided) continue; // Skip voided items in cash out

                orderItemsCount += item.quantity;

                // Prefer historical cost recorded with the item, fallback to current product cost
                let itemCost = 0;
                if (item.cost !== undefined) {
                    itemCost = Number(item.cost);
                } else if (item.costPrice !== undefined) {
                    itemCost = Number(item.costPrice);
                } else {
                    // Use cache or fetch from DB
                    const pid = Number(item.productId);
                    if (productCostCache[pid] !== undefined) {
                        itemCost = productCostCache[pid];
                    } else if (pid > 0) {
                        const product = db.prepare('SELECT cost FROM products WHERE id = ?').get(pid) as any;
                        itemCost = Number(product?.cost || 0);
                        productCostCache[pid] = itemCost;
                    }
                }

                const itemProfit = (Number(item.price) - itemCost) * item.quantity;
                orderProfit += itemProfit;
            }

            userAggregates[userId].totalItems += orderItemsCount;
            userAggregates[userId].totalProfit += orderProfit;
        }

        const expectedCashAmount = totalCashReceived - totalChangeGiven;

        // Get previous day's cash out to use as opening cash
        const previousDay = new Date(targetDate);
        previousDay.setDate(previousDay.getDate() - 1);
        const prevDayStart = new Date(previousDay.getFullYear(), previousDay.getMonth(), previousDay.getDate(), 0, 0, 0, 0);
        const prevDayEnd = new Date(previousDay.getFullYear(), previousDay.getMonth(), previousDay.getDate(), 23, 59, 59, 999);

        const prevDayStartTS = Math.floor(prevDayStart.getTime() / 1000);
        const prevDayEndTS = Math.floor(prevDayEnd.getTime() / 1000);

        const previousCashOut = db.prepare(`
            SELECT expected_cash FROM cash_outs
            WHERE (date >= ? AND date <= ?) OR (date >= ? AND date <= ?)
            ORDER BY created_at DESC LIMIT 1
        `).get(prevDayStart.toISOString(), prevDayEnd.toISOString(), prevDayStartTS, prevDayEndTS) as any;

        const openingCash = previousCashOut?.expected_cash || '0';

        // Convert user aggregates to array and calculate overall totals
        const usersData = Object.values(userAggregates);
        const overallTotalSales = usersData.reduce((sum: number, user: any) => sum + user.totalSales, 0);
        const overallTotalItems = usersData.reduce((sum: number, user: any) => sum + user.totalItems, 0);
        const overallTotalProfit = usersData.reduce((sum: number, user: any) => sum + user.totalProfit, 0);

        return {
            date: targetDate.toISOString(),
            openingCash,
            cashReceived: totalCashReceived.toFixed(2),
            changeGiven: totalChangeGiven.toFixed(2),
            expectedCash: expectedCashAmount.toFixed(2),
            transactionCount: cashOrders.length,
            // New aggregated data
            totalSales: overallTotalSales.toFixed(2),
            totalItems: overallTotalItems,
            totalProfit: overallTotalProfit.toFixed(2),
            users: usersData.map(user => ({
                userId: user.userId,
                userName: user.userName,
                userRole: user.userRole,
                orderCount: user.orderCount,
                totalSales: user.totalSales.toFixed(2),
                totalItems: user.totalItems,
                totalProfit: user.totalProfit.toFixed(2),
            })),
        };
    });

    ipcMain.handle('db:cash-outs:create', async (_event: any, cashOutData: any) => {
        if (!db) throw new Error('Database not initialized');
        if (!currentUserId) throw new Error('No user logged in');

        const {
            date,
            openingCash,
            cashReceived,
            changeGiven,
            expectedCash,
            actualCash,
            discrepancy,
            notes
        } = cashOutData;

        const stmt = db.prepare(`
            INSERT INTO cash_outs (user_id, date, opening_cash, cash_received, change_given, expected_cash, actual_cash, discrepancy, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const info = stmt.run(
            currentUserId,
            date,
            String(openingCash || '0'),
            String(cashReceived),
            String(changeGiven),
            String(expectedCash),
            actualCash ? String(actualCash) : null,
            discrepancy ? String(discrepancy) : null,
            notes || null,
            new Date().toISOString()
        );

        return { id: info.lastInsertRowid, ...cashOutData };
    });

    ipcMain.handle('db:cash-outs:get-all', async () => {
        if (!db) throw new Error('Database not initialized');
        return db.prepare(`
            SELECT co.*, u.name as userName
            FROM cash_outs co
            JOIN users u ON co.user_id = u.id
            ORDER BY co.created_at DESC
        `).all();
    });

    // File dialogs - SECURE HANDLERS
    secureFileHandler('dialog:openFile', async (_event: any, options: any) => {
        if (!mainWindow)
            return null;
        const result = await dialog.showOpenDialog(mainWindow, options);

        // Validate the selected file path
        if (result.filePaths.length > 0) {
            const selectedPath = result.filePaths[0];
            if (SecureFileSystem.validatePath(selectedPath)) {
                return selectedPath;
            } else {
                log.warn('File path validation failed', { path: selectedPath });
                return null;
            }
        }
        return null;
    });

    secureFileHandler('dialog:saveFile', async (_event: any, options: any) => {
        if (!mainWindow)
            return null;
        const result = await dialog.showSaveDialog(mainWindow, options);

        // Validate the selected file path
        if (result.filePath) {
            if (SecureFileSystem.validatePath(result.filePath)) {
                return result.filePath;
            } else {
                log.warn('File path validation failed', { path: result.filePath });
                return null;
            }
        }
        return null;
    });

    // Settings
    ipcMain.handle('open-settings', async () => {
        if (!mainWindow)
            return;
        // This can open a settings window or modal
        log.info('Opening settings');
    });

    // Auto-update handlers
    ipcMain.handle('app:check-for-updates', async () => {
        if (isDev) {
            log.info('Skipping update check in development mode');
            return { success: false, message: 'Update check disabled in development mode' };
        }

        try {
            log.info('Manual update check initiated');
            const result = await autoUpdater.checkForUpdates();
            if (!result) return { success: false, message: 'No update info returned' };
            return { success: true, updateInfo: result.updateInfo };
        } catch (error) {
            log.error('Manual update check failed:', error);
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    });

    ipcMain.handle('app:download-update', async () => {
        try {
            log.info('Manual update download initiated');
            await autoUpdater.downloadUpdate();
            return { success: true };
        } catch (error) {
            log.error('Manual update download failed:', error);
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    });

    ipcMain.handle('app:quit-and-install', async () => {
        log.info('Quit and install update requested');
        setImmediate(() => autoUpdater.quitAndInstall());
        return { success: true };
    });

    ipcMain.handle('app:get-update-status', async () => {
        // This would require storing update state, for now return basic info
        return {
            isChecking: false,
            isDownloading: false,
            isReady: false,
            currentVersion: app.getVersion()
        };
    });

    ipcMain.handle('get-app-version', async () => {
        return app.getVersion();
    });

    // Window controls
    ipcMain.on('window:minimize', () => {
        if (mainWindow)
            mainWindow.minimize();
    });

    ipcMain.on('window:maximize', () => {
        if (mainWindow) {
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            } else {
                mainWindow.maximize();
            }
        }
    });

    ipcMain.on('window:close', () => {
        if (mainWindow)
            mainWindow.close();
    });

    ipcMain.handle('app:process-image-upload', async (_event: any, filePath: string) => {
        log.info('Processing image upload', { filePath });
        try {
            const image = nativeImage.createFromPath(filePath);
            if (image.isEmpty()) {
                throw new Error('Failed to load image');
            }

            // Resize if too large (max 500px dimension) to prevent UI freeze
            const size = image.getSize();
            const maxDimension = 500;

            if (size.width > maxDimension || size.height > maxDimension) {
                const resizeOptions = size.width > size.height
                    ? { width: maxDimension }
                    : { height: maxDimension };
                const resized = image.resize(resizeOptions);
                return { success: true, dataUrl: resized.toDataURL() };
            }

            return { success: true, dataUrl: image.toDataURL() };
        } catch (error) {
            log.error('Image processing failed:', error);
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    });

    ipcMain.handle('app:shutdown', () => {
        app.quit();
    });

    // Logging
    ipcMain.on('app:log', (_event: any, { level, message, meta }: { level: string, message: string, meta?: any }) => {
        // Type-safe logging to avoid TypeScript errors
        const logger = log as any;
        if (typeof logger[level] === 'function') {
            logger[level](`[RENDERER] ${message}`, meta);
        } else {
            logger.info(`[RENDERER] ${message}`, meta);
        }
    });

    // Peripheral operations (stubs - need implementation)
    ipcMain.handle('peripherals:discover', async () => {
        log.info('[DEBUG] Discovering peripherals');
        const devices: any[] = [];

        try {
            // Discover USB printers
            log.info('[DEBUG] Searching for USB printers...');
            const usbDevices = USB.findPrinter();
            log.info(`[DEBUG] USB.findPrinter() returned ${usbDevices.length} devices`);
            if (usbDevices.length > 0) {
                log.info(`[DEBUG] Found ${usbDevices.length} USB printer(s):`);
                usbDevices.forEach((d: any, index: number) => {
                    log.info(`[DEBUG]  ${index + 1}. Vendor: ${d.deviceDescriptor?.idVendor}, Product: ${d.deviceDescriptor?.idProduct}`);
                    devices.push({
                        id: `usb-${d.deviceDescriptor?.idVendor || '0'}-${d.deviceDescriptor?.idProduct || '0'}`,
                        name: `USB Printer (${d.deviceDescriptor?.idVendor || '?'}:${d.deviceDescriptor?.idProduct || '?'})`,
                        type: 'printer',
                        status: 'disconnected',
                        connectionType: 'usb',
                        vendorId: d.deviceDescriptor?.idVendor,
                        productId: d.deviceDescriptor?.idProduct
                    });
                });
            } else {
                log.info('[DEBUG] No USB printers found');
            }
        } catch (e) {
            log.error('[DEBUG] Error during USB printer discovery:', e);
        }

        if (devices.length === 0) {
            log.info('[DEBUG] No peripherals found');
        } else {
            log.info(`[DEBUG] Found ${devices.length} peripherals`);
        }

        return { success: true, devices };
    });

    ipcMain.handle('peripherals:test-printer', async (_event: any, type: string, address: string) => {
        log.info('Testing printer', { type, address });
        try {
            let device;
            if (type === 'usb') {
                device = new USB();
            } else if (type === 'network') {
                device = new Network(address);
            } else {
                return { success: false, error: 'Unsupported printer type' };
            }

            return new Promise((resolve) => {
                device.open((error: any) => {
                    if (error) {
                        log.error('Printer test failed:', error);
                        resolve({ success: false, error: error.message });
                        return;
                    }
                    const printer = new escpos.Printer(device);
                    printer
                        .font('a')
                        .align('ct')
                        .style('bu')
                        .size(1, 1)
                        .text('Printer Test Successful')
                        .cut()
                        .close(() => {
                            resolve({ success: true });
                        });
                });
            });
        } catch (err: any) {
            log.error('Printer test error:', err);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('peripherals:print-escpos', async (_event: any, { content, type, address }: any) => {
        log.info('[DEBUG] Printing ESC/POS', { type, address, contentLength: content?.length });
        try {
            let device;
            if (type === 'usb') {
                log.info('[DEBUG] Creating USB printer device');
                device = new USB();
            } else if (type === 'network') {
                log.info('[DEBUG] Creating network printer device with address:', address);
                device = new Network(address);
            } else {
                log.error('[DEBUG] Unsupported printer type:', type);
                return { success: false, error: 'Unsupported printer type' };
            }

            log.info('[DEBUG] Attempting to open printer device');
            return new Promise((resolve) => {
                device.open((error: any) => {
                    if (error) {
                        log.error('[DEBUG] Printer open failed:', error);
                        resolve({ success: false, error: error.message });
                        return;
                    }
                    log.info('[DEBUG] Printer device opened successfully');
                    const printer = new escpos.Printer(device);

                    // Check if content is raw buffer (hex) or text
                    if (content.startsWith('<')) {
                        log.info('[DEBUG] Printing raw content (buffer)');
                        // Assume raw hex/buffer
                        printer
                            .raw(Buffer.from(content))
                            .cut()
                            .close(() => {
                                log.info('[DEBUG] Raw content printing completed');
                                resolve({ success: true });
                            });
                    } else {
                        log.info('[DEBUG] Printing text content');
                        // Standard text printing
                        printer
                            .text(content)
                            .cut()
                            .close(() => {
                                log.info('[DEBUG] Text printing completed');
                                resolve({ success: true });
                            });
                    }
                });
            });
        } catch (err: any) {
            log.error('[DEBUG] ESC/POS printing error:', err);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('peripherals:print-receipt', async (_event: any, order: any, silent: boolean = true) => {
        log.info('Printing standard receipt (silent)', { orderId: order.id, silent });
        try {
            if (!mainWindow) return { success: false, error: 'Main window not available' };

            const printWindow = new BrowserWindow({
                show: false,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    sandbox: true, // Consistent security
                    webSecurity: true
                }
            });

            const settings = db?.prepare('SELECT * FROM settings WHERE id = 1').get() as any;

            const getFont = (f: string) => {
                if (!f) return 'Standard';
                const map: Record<string, string> = {
                    'modern': 'Modern',
                    'condensed': 'Condensed',
                    'mono': 'monospace',
                    'standard': 'Standard'
                };
                return map[f] || f;
            };

            // Basic HTML receipt for standard printers
            const html = `
                <html>
                    <head>
                        <style>
                            @font-face { font-family: 'Standard'; src: local('Courier New'); }
                            @font-face { font-family: 'Modern'; src: local('Segoe UI'), local('Arial'); }
                            @font-face { font-family: 'Condensed'; src: local('Arial Narrow'); }
                            
                            body { font-family: sans-serif; padding: 10px; width: ${settings?.receipt_width === '58mm' ? '58mm' : '80mm'}; font-size: 12px; }
                            .center { text-align: center; }
                            .flex-between { display: flex; justify-content: space-between; align-items: flex-start; }
                            
                             .header-font { font-family: ${getFont(settings?.receipt_header_font)}; }
                             .items-font { font-family: ${getFont(settings?.receipt_items_font)}; }
                             .numbers-font { font-family: ${getFont(settings?.receipt_numbers_font)}; }
                             
                             .header-size { font-size: ${16 * ((settings?.receipt_header_scale || 100) / 100)}px; }
                             .items-size { font-size: ${12 * ((settings?.receipt_items_scale || 100) / 100)}px; }
                             .details-font { font-family: ${getFont(settings?.receipt_details_font)}; }
                             .details-size { font-size: ${11 * ((settings?.receipt_details_scale || 90) / 100)}px; }
                             .metadata-font { font-family: ${getFont(settings?.receipt_metadata_font)}; }
                             .metadata-size { font-size: ${10 * ((settings?.receipt_metadata_scale || 80) / 100)}px; }
                             .numbers-size { font-size: ${12 * ((settings?.receipt_numbers_scale || 100) / 100)}px; }
                            .total-size { font-size: ${18 * ((settings?.receipt_numbers_scale || 100) / 100)}px; }

                            .divider { border-top: 1px solid #000; margin: 5px 0; opacity: ${(settings?.receipt_divider_opacity || 20) / 100}; }
                            .thick-divider { border-top: 2px solid #000; margin: 10px 0; opacity: ${(settings?.receipt_divider_opacity || 20) / 100}; }
                            .item-divider { border-top: 1px ${settings?.receipt_item_divider_style || 'dashed'} #000; margin: 4px 0; opacity: ${(settings?.receipt_divider_opacity || 20) / 100}; }
                            .total-divider { border-top: 2px solid #000; margin: 5px 0; opacity: ${(settings?.receipt_divider_opacity || 20) / 100 * 2.5}; }
                            
                            .compact { margin: 2px 0 !important; }
                        </style>
                    </head>
                    <body>
                        <div class="center header-font header-size">
                            ${settings?.store_logo && settings?.receipt_show_logo ? `<img src="${settings.store_logo}" style="max-height: ${60 * ((settings?.receipt_logo_scale || 100) / 100)}px; margin-bottom: 2px;" /><br/>` : ''}
                            <div style="font-weight: bold;">${settings?.store_name || 'Store Receipt'}</div>
                            ${settings?.store_address ? `<div style="font-size: 0.8em; margin-bottom: 2px;">${settings.store_address}</div>` : ''}
                        </div>

                        ${settings?.receipt_header_text ? `<div class="divider"></div><div class="center" style="font-style: italic; font-size: 0.9em;">${settings.receipt_header_text}</div>` : ''}
                        
                        <div class="thick-divider"></div>

                        <div class="numbers-font" style="font-size: 0.8em;">
                            ${settings?.receipt_show_order_number ? `<div class="flex-between"><span>Order Reference</span><span>#${order.id}</span></div>` : ''}
                            <div class="flex-between"><span>Date</span><span>${new Date(order.createdAt).toLocaleString()}</span></div>
                        </div>

                        <div class="thick-divider"></div>

                        <div class="items-font items-size">
                             ${(typeof order.items === 'string' ? JSON.parse(order.items) : order.items).map((item: any, idx: number, arr: any[]) => `
                                <div class="${settings?.receipt_compact_mode ? 'compact' : ''}">
                                    <div class="flex-between">
                                        <div style="font-weight: bold;">${item.productName || item.name}</div>
                                        <div class="numbers-font">${item.total || (item.price * item.quantity).toFixed(2)}</div>
                                    </div>
                                    <div class="details-font details-size" style="opacity: 0.85;">${item.quantity} x ${item.price}</div>
                                    ${settings?.receipt_show_item_divider && idx < arr.length - 1 ? '<div class="item-divider"></div>' : ''}
                                </div>
                            `).join('')}
                        </div>

                        <div class="thick-divider"></div>

                        <div class="numbers-font numbers-size">
                            <div class="flex-between"><span>SUBTOTAL</span><span>${order.total}</span></div>
                            ${settings?.receipt_show_total_divider ? '<div class="total-divider"></div>' : ''}
                            <div class="flex-between total-size" style="font-weight: 1000; margin-top: 5px;">
                                <span>TOTAL</span>
                                <span>${order.total}</span>
                            </div>
                        </div>

                        ${settings?.receipt_footer_text ? `<div class="divider" style="margin-top: 20px;"></div><div class="center" style="font-size: 0.8em; opacity: 0.7;">${settings.receipt_footer_text}</div>` : ''}

                        ${settings?.receipt_show_qr_code && settings?.payment_qr_code ? `
                            <div class="center" style="margin-top: 20px;">
                                <div style="font-size: 10px; margin-bottom: 5px;">SCAN TO PAY</div>
                                <img src="${settings.payment_qr_code}" style="width: ${100 * ((settings.qr_code_scale || 100) / 100)}px;" />
                            </div>
                        ` : ''}
                    </body>
                </html>
            `;

            const tempPath = path.join(app.getPath('temp'), `receipt-${Date.now()}.html`);
            fs.writeFileSync(tempPath, html);

            await printWindow.loadFile(tempPath);

            return new Promise((resolve) => {
                printWindow.webContents.print({ silent, printBackground: true }, (success, failureReason) => {
                    printWindow.close();
                    fs.unlinkSync(tempPath);
                    if (success) {
                        resolve({ success: true });
                    } else {
                        resolve({ success: false, error: failureReason });
                    }
                });
            });
        } catch (err: any) {
            log.error('Standard printing error:', err);
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('peripherals:print-report', async (_event: any, htmlContent: string, silent: boolean = true) => {
        log.info('Printing report (silent)', { silent });
        try {
            if (!mainWindow) return { success: false, error: 'Main window not available' };

            const printWindow = new BrowserWindow({
                show: false,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    sandbox: true, // Consistent security
                    webSecurity: true
                }
            });

            const tempPath = path.join(app.getPath('temp'), `report-${Date.now()}.html`);
            fs.writeFileSync(tempPath, htmlContent);

            await printWindow.loadFile(tempPath);

            return new Promise((resolve) => {
                printWindow.webContents.print({ silent, printBackground: true }, (success, failureReason) => {
                    printWindow.close();
                    fs.unlinkSync(tempPath);
                    if (success) {
                        resolve({ success: true });
                    } else {
                        resolve({ success: false, error: failureReason });
                    }
                });
            });
        } catch (err: any) {
            log.error('Report printing error:', err);
            return { success: false, error: err.message };
        }
    });

    // Cash drawer
    ipcMain.handle('peripherals:open-cash-drawer', async (_event: any, port: string, pulseDuration: number) => {
        log.info('Opening cash drawer (stub)', { port, pulseDuration });
        // TODO: Implement
        return false;
    });

    ipcMain.handle('peripherals:get-cash-drawer-status', async () => {
        log.info('Getting cash drawer status (stub)');
        return false;
    });

    ipcMain.handle('peripherals:close-cash-drawer', async () => {
        log.info('Closing cash drawer (stub)');
        return false;
    });

    // Customer display
    ipcMain.handle('peripherals:update-customer-display', async (_event: any, content: any, displayType?: string) => {
        log.info('Updating customer display', { content, displayType });
        if (customerDisplayWindow) {
            customerDisplayWindow.webContents.send('customer-display:update', content);
            return true;
        }
        return false;
    });

    ipcMain.handle('window:open-customer-display', async () => {
        if (customerDisplayWindow) {
            customerDisplayWindow.focus();
            return true;
        }

        const iconPath = !isDev
            ? path.join(_dirname, 'renderer/Copilot_20260101_152954.png')
            : path.join(_dirname, '../client/public/Copilot_20260101_152954.png');

        customerDisplayWindow = new BrowserWindow({
            width: 1024,
            height: 768,
            title: 'Customer Display',
            autoHideMenuBar: true,
            webPreferences: {
                preload: preloadPath,
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: true,
            },
            icon: iconPath,
        });

        const devServerPort = process.env.VITE_DEV_SERVER_PORT || '5173';
        const startUrl = isDev
            ? `http://localhost:${devServerPort}/#/customer-display`
            : `${pathToFileURL(path.join(_dirname, 'renderer/index.html')).href}#/customer-display`;

        customerDisplayWindow.loadURL(startUrl);

        customerDisplayWindow.on('closed', () => {
            customerDisplayWindow = null;
        });

        return true;
    });

    ipcMain.handle('peripherals:clear-customer-display', async (_event: any, displayType?: string) => {
        log.info('Clearing customer display', { displayType });
        if (customerDisplayWindow) {
            customerDisplayWindow.webContents.send('customer-display:clear');
            return true;
        }
        return false;
    });

    ipcMain.handle('peripherals:get-customer-display-status', async () => {
        log.info('Getting customer display status (stub)');
        return false;
    });

    // Scale
    ipcMain.handle('peripherals:connect-scale', async (_event: any, port: string) => {
        log.info('Connecting scale (stub)', { port });
        return false;
    });

    ipcMain.handle('peripherals:disconnect-scale', async () => {
        log.info('Disconnecting scale (stub)');
        return false;
    });

    ipcMain.handle('peripherals:read-scale-weight', async () => {
        log.info('Reading scale weight (stub)');
        return null;
    });

    ipcMain.handle('peripherals:tare-scale', async () => {
        log.info('Taring scale (stub)');
        return false;
    });

    ipcMain.handle('peripherals:get-scale-status', async () => {
        log.info('Getting scale status (stub)');
        return false;
    });
}

/**
 * Create and set the application menu
 */
function setupApplicationMenu() {
    const isMac = process.platform === 'darwin';
    const template: MenuItemConstructorOptions[] = [];

    // File menu
    const fileMenu: MenuItemConstructorOptions = {
        label: 'File',
        submenu: [
            {
                label: 'Exit',
                accelerator: isMac ? 'Cmd+Q' : 'Ctrl+Q',
                click: () => {
                    app.quit();
                }
            }
        ]
    };

    // View menu
    const viewMenu: MenuItemConstructorOptions = {
        label: 'View',
        submenu: [
            {
                label: 'Refresh',
                accelerator: 'F5',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send('menu:refresh');
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Toggle Full Screen',
                accelerator: isMac ? 'Ctrl+Cmd+F' : 'F11',
                click: () => {
                    if (mainWindow) {
                        mainWindow.setFullScreen(!mainWindow.isFullScreen());
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Zoom In',
                accelerator: 'CmdOrCtrl+Plus',
                role: 'zoomIn'
            },
            {
                label: 'Zoom Out',
                accelerator: 'CmdOrCtrl+-',
                role: 'zoomOut'
            },
            {
                label: 'Reset Zoom',
                accelerator: 'CmdOrCtrl+0',
                role: 'resetZoom'
            }
        ]
    };

    // Add Developer Tools only in development for debugging
    if (isDev) {
        (viewMenu.submenu as MenuItemConstructorOptions[]).push(
            { type: 'separator' },
            {
                label: 'Toggle Developer Tools',
                accelerator: isMac ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.toggleDevTools();
                    }
                }
            }
        );
    }

    // Navigation menu
    const navigationMenu: MenuItemConstructorOptions = {
        label: 'Navigation',
        submenu: [
            {
                label: 'Point of Sale',
                accelerator: 'CmdOrCtrl+1',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send('menu:navigate', '/');
                    }
                }
            },
            {
                label: 'Inventory',
                accelerator: 'CmdOrCtrl+2',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send('menu:navigate', '/inventory');
                    }
                }
            },
            {
                label: 'Sales Reports',
                accelerator: 'CmdOrCtrl+3',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send('menu:navigate', '/sales');
                    }
                }
            },
            {
                label: 'Customers',
                accelerator: 'CmdOrCtrl+4',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send('menu:navigate', '/customers');
                    }
                }
            },
            {
                label: 'Settings',
                accelerator: 'CmdOrCtrl+5',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send('menu:navigate', '/settings');
                    }
                }
            }
        ]
    };

    // Help menu
    const helpMenu: MenuItemConstructorOptions = {
        label: 'Help',
        submenu: [
            {
                label: 'About OpenSauce POS',
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send('menu:about');
                    }
                }
            }
        ]
    };

    // Add menus to template
    template.push(fileMenu, viewMenu, navigationMenu, helpMenu);

    // On macOS, add the app menu
    if (isMac) {
        template.unshift({
            label: app.getName(),
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

/**
 * App event handlers
 */

// Request single instance lock to prevent multiple processes accessing the database
// const gotTheLock = electron.app.requestSingleInstanceLock();

// if (!gotTheLock) {
//     app.quit();
//     process.exit(0);
// }

// electron.app.on('second-instance', (_event: Event, commandLine: string[], workingDirectory: string) => {
//     // Someone tried to run a second instance, we should focus our window.
//     if (mainWindow) {
//         if (mainWindow.isMinimized()) mainWindow.restore();
//         mainWindow.focus();
//     }
// });

// Global error handlers
process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception:', error);
    log.error('Stack trace:', error instanceof Error ? error.stack : 'No stack available');
});

process.on('unhandledRejection', (reason, promise) => {
    log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.on('ready', async () => {
    try {
        log.info('App starting...', { isDev, version: app.getVersion() });
        log.info('Process PID:', process.pid);
        log.info('Process argv:', process.argv);

        // Initialize database
        const initializedDb = initializeDatabase();
        log.info('Database initialization completed, db =', !!initializedDb);
        console.log('DEBUG: db object after init:', initializedDb);

        // Update the global db variable only if initialization was successful
        if (initializedDb) {
            db = initializedDb;
        } else {
            log.error('Database initialization failed, running in offline mode');
        }

        // Setup IPC handlers (moved before migrations to ensure they're available)
        console.log('DEBUG: Setting up IPC handlers, db =', db);
        setupIpcHandlers();

        // Run migrations
        if (db) {
            try {
                // Determine migrations folder path based on environment
                let migrationsFolder;
                if (isDev) {
                    // In development, migrations are in the project root
                    migrationsFolder = path.resolve(process.cwd(), 'migrations');
                } else {
                    // In production, migrations are in the root of the ASAR/package
                    // We need to find where they were bundled
                    migrationsFolder = path.resolve(_dirname, 'migrations');
                    if (!fs.existsSync(migrationsFolder)) {
                        migrationsFolder = path.resolve(_dirname, '../migrations');
                    }
                    if (!fs.existsSync(migrationsFolder)) {
                        // Fallback for some builder configurations
                        migrationsFolder = path.join((process as any).resourcesPath, 'migrations');
                    }
                }

                const journalPath = path.join(migrationsFolder, 'meta/_journal.json');
                log.info('Migrations folder path (resolved):', migrationsFolder);
                log.info('Migrations folder exists:', fs.existsSync(migrationsFolder));
                log.info('Journal file path:', journalPath);
                log.info('Journal file exists:', fs.existsSync(journalPath));

                // List files in migrations folder
                if (fs.existsSync(migrationsFolder)) {
                    const files = fs.readdirSync(migrationsFolder);
                    log.info('Files in migrations folder:', files);
                } else {
                    log.warn('Migrations folder does not exist, skipping migrations');
                    // Continue with app startup even if migrations folder doesn't exist
                }

                log.info('Calling migrate with migrationsFolder:', migrationsFolder);
                const drizzleDb = drizzle(db);
                try {
                    // Check if essential tables exist before running migrations
                    const tablesExist = db.prepare(`
                        SELECT name FROM sqlite_master 
                        WHERE type='table' AND name IN ('customers', 'products', 'orders', 'settings')
                    `).all();

                    if (tablesExist.length >= 4) {
                        log.info('Essential tables already exist, skipping migrations');
                    } else {
                        migrate(drizzleDb, { migrationsFolder });
                        log.info('Migrations executed successfully');
                    }
                } catch (migrationError) {
                    log.error('Migration failed with error:', migrationError);
                    log.error('Migration error message:', migrationError instanceof Error ? migrationError.message : migrationError);
                    log.error('Migration error stack:', migrationError instanceof Error ? migrationError.stack : 'No stack');
                    // Continue with app startup despite migration failure
                    console.error('CRITICAL: Migration failed:', migrationError instanceof Error ? migrationError.message : migrationError);
                }
            } catch (error) {
                log.error('Migration failed:', error);
                log.error('Migration error stack:', error instanceof Error ? error.stack : 'No stack');
            }
        } else {
            log.warn('Skipping migrations because db is null');
        }

        // Create main window
        await createWindow();

        // Setup application menu
        setupApplicationMenu();

        log.info('App ready');
        // Initialize auto updater (only in production)
        if (!isDev) {
            log.info('Initializing auto updater...');
            try {
                // Check for updates periodically (every 24 hours)
                setInterval(() => {
                    autoUpdater.checkForUpdates().catch(err => {
                        log.warn('Periodic update check failed:', err);
                    });
                }, 24 * 60 * 60 * 1000); // 24 hours

                // Initial update check after app is ready
                setTimeout(() => {
                    autoUpdater.checkForUpdates().catch(err => {
                        log.warn('Initial update check failed:', err);
                    });
                }, 10000); // Wait 10 seconds after startup
            } catch (error) {
                log.error('Failed to initialize auto updater:', error);
            }
        }
    } catch (error) {
        log.error('Failed to start app:', error);
        app.quit();
    }
});

app.on('window-all-closed', () => {
    // On macOS, apps typically stay active until the user quits explicitly
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS, re-create window when the dock icon is clicked
    if (mainWindow === null) {
        createWindow().catch((error) => {
            log.error('Failed to create window:', error);
        });
    }
});

app.on('quit', () => {
    log.info('App quitting');
    // Close database connection
    if (db) {
        db.close();
        log.info('Database connection closed');
    }
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
    log.error('Uncaught exception:', error);
});