import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join } from 'path';

// Production database path
const dbPath = join(homedir(), 'AppData', 'Roaming', 'opensauce-pos', 'database', 'sqlite.db');

console.log('Initializing production database...');
console.log('Database path:', dbPath);

try {
    // Create database directory if it doesn't exist
    const fs = await import('fs');
    const path = await import('path');
    
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log('Created database directory:', dbDir);
    }

    // Initialize database
    const db = new Database(dbPath);
    
    // Import and run the initialization function
    const { initializeDefaultSchema } = await import('../electron/db-init.js');
    initializeDefaultSchema(db);
    
    // Verify tables were created
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Created tables:');
    tables.forEach(table => console.log('  -', table.name));
    
    // Specifically check for orders table with notes column
    const ordersColumns = db.prepare("PRAGMA table_info(orders)").all();
    const hasNotesColumn = ordersColumns.some(col => col.name === 'notes');
    
    if (hasNotesColumn) {
        console.log('✓ SUCCESS: Orders table has notes column');
    } else {
        console.log('✗ ERROR: Orders table missing notes column');
        process.exit(1);
    }
    
    db.close();
    console.log('✅ Production database initialized successfully!');
    
} catch (error) {
    console.error('❌ Failed to initialize production database:', error.message);
    if (error.stack) {
        console.error('Stack trace:', error.stack);
    }
    process.exit(1);
}