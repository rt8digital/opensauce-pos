import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source database path
const sourceDbPath = 'F:\\sqlite.db';
// Target database path
const targetDbPath = path.join(__dirname, 'sqlite.db');

// Table order to handle dependencies
const tables = [
    'categories',
    'customers',
    'users',
    'products',
    'discounts',
    'settings',
    'translations',
    'bot_settings',
    'whatsapp_consent',
    'orders',
    'order_items',
    'whatsapp_queue'
];

// Migration summary
const summary = {};

// Logger
function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

function error(message) {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`);
}

// Migrate a single table
function migrateTable(sourceDb, targetDb, tableName) {
    log(`Starting migration for table: ${tableName}`);

    try {
        // Get all data from source table
        const selectStmt = sourceDb.prepare(`SELECT * FROM ${tableName}`);
        const rows = selectStmt.all();

        if (rows.length === 0) {
            log(`No data in ${tableName}`);
            summary[tableName] = 0;
            return;
        }

        // Get column names for INSERT
        const columns = Object.keys(rows[0]);
        const placeholders = columns.map(() => '?').join(', ');
        const insertSql = `INSERT OR IGNORE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

        const insertStmt = targetDb.prepare(insertSql);

        let inserted = 0;

        // Insert each row
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const values = columns.map(col => row[col]);

            try {
                const result = insertStmt.run(values);
                if (result.changes > 0) {
                    inserted++;
                } // else ignored
            } catch (err) {
                error(`Failed to insert into ${tableName} row ${i + 1}: ${err.message}`);
            }
        }

        log(`Migration completed for ${tableName}: ${inserted} inserted`);
        summary[tableName] = inserted;
    } catch (err) {
        error(`Failed to migrate ${tableName}: ${err.message}`);
    }
}

// Main migration function
function migrate() {
    log('Starting data migration from F:\\sqlite.db to ./sqlite.db');

    let sourceDb;
    let targetDb;

    try {
        sourceDb = new Database(sourceDbPath, { readonly: true });
        log('Source database opened successfully');
    } catch (err) {
        error(`Failed to open source database: ${err.message}`);
        return;
    }

    try {
        targetDb = new Database(targetDbPath);
        log('Target database opened successfully');
    } catch (err) {
        error(`Failed to open target database: ${err.message}`);
        sourceDb.close();
        return;
    }

    // Enable foreign keys on target
    targetDb.pragma('foreign_keys = ON');

    for (const tableName of tables) {
        try {
            migrateTable(sourceDb, targetDb, tableName);
        } catch (err) {
            error(`Migration failed for ${tableName}: ${err.message}`);
        }
    }

    // Close databases
    try {
        sourceDb.close();
    } catch (err) {
        error(`Error closing source DB: ${err.message}`);
    }

    try {
        targetDb.close();
    } catch (err) {
        error(`Error closing target DB: ${err.message}`);
    }

    // Print summary
    log('Migration completed. Summary:');
    let totalRecords = 0;
    for (const [table, count] of Object.entries(summary)) {
        log(`${table}: ${count} records migrated`);
        totalRecords += count;
    }
    log(`Total records migrated: ${totalRecords}`);
}

// Run the migration
migrate();