import Database from 'better-sqlite3';
const db = new Database('./sqlite.db');
const columns = db.pragma('table_info(orders)');
console.log('Orders table columns:', columns.map(c => c.name));
if (process.versions.electron) process.exit(0);
