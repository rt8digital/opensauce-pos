import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'sqlite.db');
const db = new Database(dbPath);

// Check current columns in settings table
const columns = db.prepare("PRAGMA table_info(settings)").all();
console.log('Current settings columns:');
columns.forEach(col => console.log(`  ${col.name}: ${col.type}`));

// Add missing columns
const missingColumns = [
    { name: 'printer_device_id', sql: 'ALTER TABLE settings ADD COLUMN printer_device_id text;' },
    { name: 'vat_percentage', sql: 'ALTER TABLE settings ADD COLUMN vat_percentage real;' },
    { name: 'vat_number', sql: 'ALTER TABLE settings ADD COLUMN vat_number text;' }
];

for (const col of missingColumns) {
    const exists = columns.some(c => c.name === col.name);
    if (!exists) {
        console.log(`Adding column: ${col.name}`);
        db.prepare(col.sql).run();
        console.log(`Successfully added ${col.name}`);
    } else {
        console.log(`Column ${col.name} already exists`);
    }
}

db.close();
console.log('Done');