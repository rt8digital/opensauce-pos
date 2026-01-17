import Database from 'better-sqlite3';
const db = new Database('sqlite.db');
const tableInfo = db.prepare("PRAGMA table_info(orders)").all();
console.log('Table Info:', JSON.stringify(tableInfo, null, 2));
const sample = db.prepare("SELECT * FROM orders LIMIT 1").get();
console.log('Sample order:', JSON.stringify(sample, null, 2));
db.close();
