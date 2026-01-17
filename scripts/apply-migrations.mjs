import Database from 'better-sqlite3';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

console.log('Applying migrations manually...');

const sqlite = new Database('./sqlite.db');

try {
    // Ensure migrations table exists
    sqlite.exec(`
        CREATE TABLE IF NOT EXISTS __drizzle_migrations (
            id TEXT PRIMARY KEY,
            hash text NOT NULL,
            created_at numeric
        )
    `);

    // Read all migration files
    const migrationsDir = './migrations';
    const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    console.log('Found migration files:', files);

    for (const file of files) {
        // Check if migration already applied
        const existing = sqlite.prepare('SELECT id FROM __drizzle_migrations WHERE id = ?').get(file.replace('.sql', ''));
        if (existing) {
            console.log(`Skipping applied migration: ${file}`);
            continue;
        }

        console.log('Applying migration:', file);
        const migrationSql = readFileSync(resolve(migrationsDir, file), 'utf8');

        // Split by statement-breakpoint and execute each statement
        const statements = migrationSql.split('--> statement-breakpoint');

        sqlite.transaction(() => {
            for (const statement of statements) {
                const trimmed = statement.trim();
                if (trimmed) {
                    try {
                        sqlite.exec(trimmed);
                        console.log('  Executed statement:', trimmed.substring(0, 50) + (trimmed.length > 50 ? '...' : ''));
                    } catch (e) {
                        // Ignore "table/column already exists" errors for robustness
                        if (!e.message.includes('already exists') && !e.message.includes('duplicate column name')) {
                            throw e;
                        }
                    }
                }
            }

            // Record this migration as completed
            sqlite.prepare('INSERT INTO __drizzle_migrations (id, hash, created_at) VALUES (?, ?, ?)').run(
                file.replace('.sql', ''),
                'manual-' + Date.now(),
                Date.now()
            );
        })();

        console.log('  Migration recorded');
    }

    console.log('All migrations applied');

    // Check tables after migration
    const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name != '__drizzle_migrations';").all();
    console.log('Tables after migration:', tables.map(t => t.name));

    sqlite.close();

    if (process.versions.electron) {
        process.exit(0);
    }
} catch (error) {
    console.error('Error applying migrations:', error);
    if (error.stack) {
        console.error('Stack trace:', error.stack);
    }
    try { sqlite.close(); } catch { }
    process.exit(1);
}