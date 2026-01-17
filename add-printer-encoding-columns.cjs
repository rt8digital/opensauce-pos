/**
 * Add printer encoding columns to existing database
 * Adds printer_codepage, printer_model, and printer_manufacturer columns to settings table
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'sqlite.db');

console.log('=== Adding Printer Encoding Columns ===');
console.log(`Database: ${dbPath}`);

try {
    const db = new Database(dbPath);
    
    // Check if columns already exist
    const columns = db.prepare(`PRAGMA table_info(settings)`).all();
    const existingColumns = columns.map(col => col.name);
    
    console.log('\nCurrent settings table columns:');
    console.log(existingColumns.join(', '));
    
    // Add printer_codepage column if it doesn't exist
    if (!existingColumns.includes('printer_codepage')) {
        console.log('\nAdding printer_codepage column...');
        db.exec(`ALTER TABLE settings ADD COLUMN printer_codepage TEXT DEFAULT 'cp437'`);
        console.log('✓ Added printer_codepage column');
    } else {
        console.log('\nprinter_codepage column already exists');
    }
    
    // Add printer_model column if it doesn't exist
    if (!existingColumns.includes('printer_model')) {
        console.log('Adding printer_model column...');
        db.exec(`ALTER TABLE settings ADD COLUMN printer_model TEXT`);
        console.log('✓ Added printer_model column');
    } else {
        console.log('printer_model column already exists');
    }
    
    // Add printer_manufacturer column if it doesn't exist
    if (!existingColumns.includes('printer_manufacturer')) {
        console.log('Adding printer_manufacturer column...');
        db.exec(`ALTER TABLE settings ADD COLUMN printer_manufacturer TEXT`);
        console.log('✓ Added printer_manufacturer column');
    } else {
        console.log('printer_manufacturer column already exists');
    }
    
    // Update existing settings row with default values if needed
    console.log('\nUpdating existing settings with default encoding values...');
    const updateResult = db.prepare(`
        UPDATE settings 
        SET printer_codepage = COALESCE(printer_codepage, 'cp437'),
            printer_model = COALESCE(printer_model, 'Generic Thermal'),
            printer_manufacturer = COALESCE(printer_manufacturer, 'Unknown')
        WHERE id = 1
    `).run();
    
    console.log(`✓ Updated ${updateResult.changes} settings row(s)`);
    
    // Verify the changes
    console.log('\n=== Verification ===');
    const updatedSettings = db.prepare('SELECT printer_codepage, printer_model, printer_manufacturer FROM settings WHERE id = 1').get();
    console.log('Current printer settings:');
    console.log(`  Codepage: ${updatedSettings.printer_codepage}`);
    console.log(`  Model: ${updatedSettings.printer_model}`);
    console.log(`  Manufacturer: ${updatedSettings.printer_manufacturer}`);
    
    db.close();
    
    console.log('\n✓ Printer encoding columns added successfully!');
    console.log('\nNext steps:');
    console.log('1. Restart the application');
    console.log('2. Go to Settings > Printer to configure encoding options');
    
} catch (error) {
    console.error('Error adding printer encoding columns:', error.message);
    process.exit(1);
}