import Database from 'better-sqlite3';
import { readdirSync, readFileSync } from 'fs';
import { resolve, join } from 'path';

async function runMigrations() {
    try {
        console.log('Connecting to database...');
        const sqlite = new Database('./sqlite.db');

        // Run migrations from the migrations folder
        const migrationsFolder = resolve('./migrations');
        console.log('Running migrations from:', migrationsFolder);

        const migrationFiles = readdirSync(migrationsFolder)
            .filter(file => file.endsWith('.sql'))
            .sort(); // Ensure they run in order

        for (const file of migrationFiles) {
            console.log(`Running migration: ${file}`);
            const filePath = join(migrationsFolder, file);
            const sql = readFileSync(filePath, 'utf-8');

            try {
                sqlite.exec(sql);
            } catch (err) {
                console.error(`Error in migration ${file}:`, err.message);
                throw err;
            }
        }

        console.log('Migrations completed successfully');

        // Check tables after migration
        const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name != '__drizzle_migrations';").all();
        console.log('Tables after migration:', tables.map(t => t.name));

        sqlite.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Migration failed:', error);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
        process.exit(1);
    }
}

// Run the migrations
runMigrations();