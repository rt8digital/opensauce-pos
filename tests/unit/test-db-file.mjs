import Database from 'better-sqlite3';
import path from 'path';

console.log('Testing file database connection...');

const dbPath = path.join(process.cwd(), 'sqlite.db');
console.log('DB path:', dbPath);

try {
    const db = new Database(dbPath);
    console.log('Database connection successful');

    // Test a simple query
    const stmt = db.prepare('SELECT name FROM sqlite_master WHERE type=?');
    const tables = stmt.all('table');
    console.log('Tables:', tables.map(t => t.name));

    db.close();
    console.log('DB closed successfully');
} catch (error) {
    console.error('Error:', error);
}