const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const oldDbPath = path.join(process.cwd(), '.clientDB', 'Fana Mini Wholesaler', 'sqlite.db');
console.log('Old DB Path:', oldDbPath);
console.log('Exists:', fs.existsSync(oldDbPath));

if (!fs.existsSync(oldDbPath)) {
    process.exit(1);
}

try {
    const db = new Database(oldDbPath, { readonly: true });

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('TABLE_LIST_BEGIN');
    for (const table of tables) {
        if (table.name.startsWith('sqlite_')) continue;
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
        console.log(`Table: ${table.name}, Rows: ${count.count}`);

        // Also print column names for the most important tables
        if (['users', 'products', 'orders', 'settings', 'customers'].includes(table.name)) {
            const cols = db.prepare(`PRAGMA table_info(${table.name})`).all();
            console.log(`  Columns: ${cols.map(c => c.name).join(', ')}`);
        }
    }
    console.log('TABLE_LIST_END');

    db.close();
} catch (error) {
    console.error('ERROR:', error.message);
}
