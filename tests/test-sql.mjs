import Database from 'better-sqlite3';

console.log('Node version:', process.version);
console.log('better-sqlite3 loaded successfully');

const sqlite = new Database('./test.db');

const sql = `CREATE TABLE users (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    name text NOT NULL,
    pin text NOT NULL,
    role text NOT NULL,
    is_owner integer DEFAULT false,
    created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
    last_login integer
);

CREATE TABLE customers (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    loyalty_points integer DEFAULT 0,
    total_spent text DEFAULT '0',
    created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL
);`;

try {
    sqlite.exec(sql);
    console.log('OK');
} catch (e) {
    console.log('Error:', e.message);
}

sqlite.close();