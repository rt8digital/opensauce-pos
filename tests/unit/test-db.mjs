import Database from 'better-sqlite3';

console.log('Better-sqlite3 loaded');

const db = new Database(':memory:');

console.log('DB created');

db.close();

console.log('DB closed');