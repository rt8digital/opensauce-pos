const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.cwd(), 'sqlite.db');
console.log('Testing connection to:', dbPath);
console.log('File exists:', fs.existsSync(dbPath));

try {
    const db = new Database(dbPath);
    console.log('✅ Connection successful');
    const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
    console.log('Users count:', users.count);
    db.close();
} catch (error) {
    console.error('❌ Connection failed:', error.message);
}
