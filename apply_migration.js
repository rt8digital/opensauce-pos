import Database from 'better-sqlite3';
import fs from 'fs';

// Connect to database
const db = new Database('sqlite.db');

try {
    // Read and apply the migration
    const migration = fs.readFileSync('migrations/003_add_missing_settings_columns.sql', 'utf8');

    // Split by statement breakpoints and execute each
    const statements = migration.split(/--> statement-breakpoint/).map(s => s.trim()).filter(s => s);

    statements.forEach((statement, index) => {
        if (statement) {
            console.log(`Executing statement ${index + 1}: ${statement}`);
            db.exec(statement);
        }
    });

    console.log('Migration applied successfully!');

    // Verify the columns exist
    const result = db.prepare("SELECT name FROM pragma_table_info('settings') WHERE name IN ('printer_type', 'whatsapp_enabled', 'whatsapp_phone_number', 'whatsapp_api_key', 'whatsapp_business_id', 'whatsapp_send_receipts')").all();
    console.log('Added columns:', result);

} catch (error) {
    console.error('Error applying migration:', error);
} finally {
    db.close();
}
