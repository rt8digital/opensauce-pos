const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'sqlite.db');

console.log('=== Database Inspection ===\n');
console.log('Database path:', dbPath);
console.log('File exists:', fs.existsSync(dbPath));

if (!fs.existsSync(dbPath)) {
    console.log('\n❌ Database file does not exist!');
    process.exit(1);
}

const stats = fs.statSync(dbPath);
console.log('File size:', stats.size, 'bytes');
console.log('Last modified:', stats.mtime);

const db = new Database(dbPath);

// List all tables
console.log('\n=== Tables ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('Tables found:', tables.map(t => t.name).join(', '));

// Check each important table
const importantTables = ['users', 'settings', 'products', 'categories', 'orders', 'customers'];

for (const table of importantTables) {
    try {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        console.log(`\n${table}: ${count.count} rows`);

        if (count.count > 0 && count.count <= 5) {
            const rows = db.prepare(`SELECT * FROM ${table}`).all();
            console.log('  Data:', JSON.stringify(rows, null, 2).substring(0, 500));
        } else if (count.count > 5) {
            const rows = db.prepare(`SELECT * FROM ${table} LIMIT 3`).all();
            console.log('  Sample (first 3):', JSON.stringify(rows, null, 2).substring(0, 500));
        }
    } catch (err) {
        console.log(`\n${table}: ❌ TABLE DOES NOT EXIST - ${err.message}`);
    }
}

// Check users specifically
console.log('\n=== Users Details ===');
try {
    const users = db.prepare('SELECT id, name, pin, role, is_owner FROM users').all();
    users.forEach(u => {
        console.log(`  ID: ${u.id}, Name: ${u.name}, PIN: ${u.pin}, Role: ${u.role}, Owner: ${u.is_owner}`);
    });
} catch (err) {
    console.log('Error reading users:', err.message);
}

db.close();
console.log('\n✅ Database inspection complete');
