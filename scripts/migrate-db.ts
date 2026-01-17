/**
 * Database Migration Script
 * Migrates data from old SQLite database to new schema
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(__dirname);

interface OldSchema {
    [key: string]: any;
}

async function migrateDatabase() {
    try {
        // Open the old database
        const oldDbPath = path.join(
            projectRoot,
            '.clientDB',
            'Fana Mini Wholesaler',
            'sqlite.db'
        );

        if (!fs.existsSync(oldDbPath)) {
            console.error(`Old database not found at: ${oldDbPath}`);
            process.exit(1);
        }

        console.log(`Opening old database from: ${oldDbPath}`);
        const oldDb = new Database(oldDbPath, { readonly: true });

        // Create a new database for migration
        const newDbPath = path.join(projectRoot, 'sqlite-migrated.db');
        console.log(`Creating new database at: ${newDbPath}`);
        const newDb = new Database(newDbPath);

        // Get list of all tables in old database
        const tables = oldDb.prepare(
            `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
        ).all() as { name: string }[];

        console.log('\n=== OLD DATABASE SCHEMA ===');
        console.log('Tables found:', tables.map(t => t.name).join(', '));

        // Inspect each table
        const schema: { [key: string]: any } = {};
        for (const table of tables) {
            const columns = oldDb.prepare(`PRAGMA table_info(${table.name})`).all();
            schema[table.name] = {
                columns: columns as any[],
                rowCount: (oldDb.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as any)?.count || 0,
            };

            console.log(`\nTable: ${table.name}`);
            console.log(`  Rows: ${schema[table.name].rowCount}`);
            console.log(`  Columns:`, columns.map((c: any) => `${c.name}(${c.type})`).join(', '));
        }

        // Export sample data from each table
        console.log('\n=== SAMPLE DATA ===');
        for (const table of tables) {
            const sampleData = oldDb.prepare(`SELECT * FROM ${table.name} LIMIT 2`).all();
            if (sampleData.length > 0) {
                console.log(`\n${table.name}:`);
                console.log(JSON.stringify(sampleData, null, 2));
            }
        }

        // Now create the new tables in the new database
        console.log('\n=== CREATING NEW SCHEMA ===');

        // Create users table
        newDb.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                pin TEXT NOT NULL,
                role TEXT NOT NULL,
                is_owner INTEGER DEFAULT 0,
                created_at INTEGER,
                last_login INTEGER
            )
        `);
        console.log('✓ Created users table');

        // Create customers table
        newDb.exec(`
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                loyalty_points INTEGER DEFAULT 0,
                total_spent TEXT DEFAULT '0',
                created_at INTEGER
            )
        `);
        console.log('✓ Created customers table');

        // Create categories table
        newDb.exec(`
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                created_at INTEGER
            )
        `);
        console.log('✓ Created categories table');

        // Create products table
        newDb.exec(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price TEXT NOT NULL,
                cost TEXT DEFAULT '0',
                image TEXT NOT NULL,
                stock_quantity INTEGER NOT NULL,
                barcode TEXT UNIQUE,
                plu TEXT,
                category_id INTEGER REFERENCES categories(id),
                category TEXT DEFAULT 'General' NOT NULL,
                weight REAL,
                weight_unit TEXT
            )
        `);
        console.log('✓ Created products table');

        // Create discounts table
        newDb.exec(`
            CREATE TABLE IF NOT EXISTS discounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                value TEXT NOT NULL,
                active INTEGER DEFAULT 1
            )
        `);
        console.log('✓ Created discounts table');

        // Create orders table
        newDb.exec(`
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER REFERENCES customers(id),
                user_id INTEGER REFERENCES users(id),
                items TEXT NOT NULL,
                total TEXT NOT NULL,
                payment_method TEXT NOT NULL,
                source TEXT DEFAULT 'pos' NOT NULL,
                status TEXT DEFAULT 'pending' NOT NULL,
                notes TEXT,
                created_at INTEGER,
                cash_received TEXT,
                change TEXT,
                discount TEXT DEFAULT '0'
            )
        `);
        console.log('✓ Created orders table');

        // Create order_items table
        newDb.exec(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                price TEXT NOT NULL,
                original_price TEXT,
                discounted_price TEXT
            )
        `);
        console.log('✓ Created order_items table');

        // Create settings table
        newDb.exec(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                store_name TEXT DEFAULT 'OpenSauce P.O.S.' NOT NULL,
                store_address TEXT,
                store_phone TEXT,
                store_email TEXT,
                store_logo TEXT,
                currency TEXT DEFAULT 'R' NOT NULL,
                printer_name TEXT,
                printer_type TEXT DEFAULT 'usb',
                printer_ip TEXT,
                printer_device_id TEXT,
                scanner_device_id TEXT,
                scanner_com_port TEXT,
                camera_device_id TEXT,
                cameraScannerEnabled INTEGER DEFAULT 1,
                cameraFacing TEXT DEFAULT 'back',
                cameraResolution TEXT DEFAULT 'auto',
                cameraTorchEnabled INTEGER DEFAULT 0,
                cameraContinuousScan INTEGER DEFAULT 0,
                cameraSupportedFormats TEXT DEFAULT 'qr_code,code_128,code_39,ean_13,ean_8,upc_a,upc_e',
                cash_drawer_port TEXT,
                customer_display_type TEXT,
                customer_display_value TEXT,
                scale_port TEXT,
                scale_device_id TEXT,
                receipt_width TEXT DEFAULT '80mm',
                receipt_custom_width INTEGER,
                receipt_header_text TEXT,
                receipt_footer_text TEXT,
                receipt_font_size TEXT DEFAULT 'medium',
                receipt_show_logo INTEGER DEFAULT 1,
                receipt_show_order_number INTEGER DEFAULT 1,
                receipt_show_date INTEGER DEFAULT 1,
                receipt_show_customer INTEGER DEFAULT 1,
                receipt_show_payment_method INTEGER DEFAULT 1,
                receipt_show_barcode INTEGER DEFAULT 0,
                receipt_continuous_printing INTEGER DEFAULT 0,
                receipt_prevent_scaling INTEGER DEFAULT 0,
                receipt_max_lines_per_page INTEGER DEFAULT 50,
                receipt_show_qr_code INTEGER DEFAULT 0,
                payment_qr_code TEXT,
                whatsapp_enabled INTEGER DEFAULT 0,
                whatsapp_phone_number TEXT,
                whatsapp_api_key TEXT,
                whatsapp_business_id TEXT,
                whatsapp_send_receipts INTEGER DEFAULT 0,
                theme TEXT DEFAULT 'light' NOT NULL,
                language TEXT DEFAULT 'en' NOT NULL,
                device_role TEXT DEFAULT 'standalone',
                server_ip_address TEXT,
                autoBackupEnabled INTEGER DEFAULT 0,
                backupFrequency TEXT DEFAULT 'daily',
                backupLocation TEXT,
                sessionTimeout INTEGER DEFAULT 30,
                passwordMinLength INTEGER DEFAULT 6,
                passwordRequireSpecial INTEGER DEFAULT 0,
                lowStockThreshold INTEGER DEFAULT 10,
                stockAlertEnabled INTEGER DEFAULT 1,
                auditLoggingEnabled INTEGER DEFAULT 1,
                auditLogLevel TEXT DEFAULT 'info',
                updated_at INTEGER,
                vat_percentage REAL,
                vat_number TEXT
            )
        `);
        console.log('✓ Created settings table');

        // Now migrate data from old to new database
        console.log('\n=== MIGRATING DATA ===');

        // Helper function to copy table data if it exists in old database
        function copyTableIfExists(tableName: string, columnMapping: { [oldCol: string]: string } = {}) {
            try {
                const oldTable = oldDb.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`).get();
                if (!oldTable) {
                    console.log(`⚠ Table '${tableName}' not found in old database, skipping`);
                    return;
                }

                const oldData = oldDb.prepare(`SELECT * FROM ${tableName}`).all();
                if (oldData.length === 0) {
                    console.log(`✓ ${tableName}: 0 rows (empty)`);
                    return;
                }

                const insertStmt = newDb.prepare(`
                    INSERT INTO ${tableName} (${Object.keys(oldData[0]).map(k => columnMapping[k] || k).join(', ')})
                    VALUES (${Object.keys(oldData[0]).map(() => '?').join(', ')})
                `);

                const insertMany = newDb.transaction((rows: any[]) => {
                    for (const row of rows) {
                        insertStmt.run(...Object.values(row));
                    }
                });

                insertMany(oldData);
                console.log(`✓ ${tableName}: ${oldData.length} rows migrated`);
            } catch (error: any) {
                console.error(`✗ Error migrating ${tableName}:`, error.message);
            }
        }

        // Copy each table
        copyTableIfExists('users');
        copyTableIfExists('customers');
        copyTableIfExists('categories');
        copyTableIfExists('products');
        copyTableIfExists('discounts');
        copyTableIfExists('orders');
        copyTableIfExists('order_items');
        copyTableIfExists('settings');

        // Close databases
        oldDb.close();
        newDb.close();

        console.log(`\n✓ Migration complete! New database saved to: ${newDbPath}`);
        console.log('\nNext steps:');
        console.log(`1. Backup current sqlite.db: copy sqlite.db sqlite-backup-${Date.now()}.db`);
        console.log(`2. Replace sqlite.db with sqlite-migrated.db: move sqlite-migrated.db sqlite.db`);
        console.log(`3. Restart the application`);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateDatabase();
