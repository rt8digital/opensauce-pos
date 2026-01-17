import Database from 'better-sqlite3';

console.log('Resetting database...');

const sqlite = new Database('./sqlite.db');

// Delete all migration records
try {
    sqlite.exec('DELETE FROM __drizzle_migrations;');
    console.log('Cleared migration records');
} catch (e) {
    console.log('Error clearing migration records:', e.message);
}

// Drop all tables except the migration tracking table
try {
    const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name != '__drizzle_migrations';").all();
    console.log('Tables to drop:', tables.map(t => t.name));
    
    for (const table of tables) {
        try {
            sqlite.exec(`DROP TABLE IF EXISTS \`${table.name}\`;`);
            console.log(`Dropped table: ${table.name}`);
        } catch (e) {
            console.log(`Error dropping table ${table.name}:`, e.message);
        }
    }
} catch (e) {
    console.log('Error getting tables to drop:', e.message);
}

sqlite.close();
console.log('Database reset completed');