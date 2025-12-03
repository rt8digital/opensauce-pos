import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../shared/schema.ts';
import path from 'path';
import fs from 'fs';

const isDev = process.env.NODE_ENV !== 'production';

// Determine database path
let dbPath: string;
if (isDev) {
    dbPath = './sqlite.db';
} else {
    // In production, use Electron's userData directory
    let userDataPath: string;
    try {
        // Only import electron if we're in an electron environment
        const { app } = require('electron');
        userDataPath = app?.getPath('userData') || path.join(require('os').homedir(), '.pos-app');
    } catch {
        // Fallback for non-electron environments
        userDataPath = path.join(require('os').homedir(), '.pos-app');
    }
    dbPath = path.join(userDataPath, 'sqlite.db');

    // Ensure directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
}

// Create database connection
const sqlite = new Database(dbPath);

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');

// Create drizzle instance
export const db = drizzle(sqlite, { schema });

// Initialize database with default data if empty
export async function initializeDatabase() {
    try {
        // Check if settings table has data
        const existingSettings = await db.select().from(schema.settings).limit(1);
        if (existingSettings.length === 0) {
            // Insert default settings
            await db.insert(schema.settings).values({
                storeName: 'OpenSauce P.O.S.',
                currency: 'R',
                theme: 'light',
                language: 'en',
                deviceRole: 'standalone',
            });

            console.log('Database initialized with default settings');
        }
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Close database connection
export async function closeDatabase() {
    sqlite.close();
}

// Export database instance for direct queries if needed
export { sqlite };