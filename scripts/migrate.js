import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'sqlite.db'));

try {
    console.log('Adding cost column to products table...');
    
    // Check if the cost column already exists
    const tableInfo = db.prepare("PRAGMA table_info(products)").all();
    const hasCostColumn = tableInfo.some(col => col.name === 'cost');
    
    if (hasCostColumn) {
        console.log('cost column already exists, skipping...');
    } else {
        // Add the cost column
        db.exec("ALTER TABLE products ADD COLUMN cost text DEFAULT '0';");
        console.log('cost column added successfully!');
    }
    
    // Also add category_id if it doesn't exist
    const hasCategoryIdColumn = tableInfo.some(col => col.name === 'category_id');
    
    if (hasCategoryIdColumn) {
        console.log('category_id column already exists, skipping...');
    } else {
        // Add the category_id column
        db.exec("ALTER TABLE products ADD COLUMN category_id integer REFERENCES categories(id);");
        console.log('category_id column added successfully!');
    }
    
    console.log('Migration completed successfully!');
} catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
} finally {
    db.close();
}