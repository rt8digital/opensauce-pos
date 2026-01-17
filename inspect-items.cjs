const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'sqlite.db');
const db = new Database(dbPath);

try {
    const row = db.prepare('SELECT id, items FROM orders ORDER BY id DESC LIMIT 1').get();
    console.log('ORDER ID:', row.id);
    console.log('ITEMS TYPE:', typeof row.items);
    console.log('ITEMS START:', row.items.substring(0, 20));
    console.log('ITEMS:', row.items);
} catch (err) {
    console.error(err);
}
db.close();
