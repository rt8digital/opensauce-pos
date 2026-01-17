import Database from 'better-sqlite3';
import path from 'path';

console.log('--- Database Analysis ---');

const dbPath = path.join(process.cwd(), 'sqlite.db');
console.log('Target Database:', dbPath);

try {
    const db = new Database(dbPath);
    console.log('Connection: Status: Connected\n');

    // 1. Get all tables
    const tables = db.prepare('SELECT name FROM sqlite_master WHERE type=?').all('table');
    const tableNames = tables.map(t => t.name);
    console.log('Tables found:', tableNames.join(', '));
    console.log('-------------------------\n');

    // 2. Count rows in each table
    console.log('Row Counts:');
    for (const tableName of tableNames) {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count;
        console.log(`- ${tableName.padEnd(20)}: ${count} rows`);
    }
    console.log('-------------------------\n');

    // 3. Detailed look at key tables

    // Users
    console.log('Users (Preview):');
    const userPreview = db.prepare('SELECT id, name, role, is_owner FROM users LIMIT 5').all();
    console.table(userPreview);

    // Settings
    console.log('Settings (Preview):');
    const settingsPreview = db.prepare('SELECT store_name, currency, theme, language FROM settings LIMIT 1').get();
    if (settingsPreview) {
        console.log('Store Name:', settingsPreview.store_name);
        console.log('Currency:', settingsPreview.currency);
        console.log('Theme:', settingsPreview.theme);
        console.log('Language:', settingsPreview.language);
    } else {
        console.log('No settings found!');
    }
    console.log('\n');

    // Products
    console.log('Products (First 5):');
    const productPreview = db.prepare('SELECT id, name, price, stock_quantity, category FROM products LIMIT 5').all();
    console.table(productPreview);

    // Orders
    console.log('Orders (Latest 5):');
    const orderPreview = db.prepare('SELECT id, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5').all();
    console.table(orderPreview);

    // 4. Data Consistency Checks
    console.log('Consistency Checks:');

    // Check for products without categories (in categories table)
    const orphanedProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id IS NULL OR category_id NOT IN (SELECT id FROM categories)').get().count;
    console.log(`- Products with missing/invalid category_id: ${orphanedProducts}`);

    // Check for orders without customer
    const guestOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE customer_id IS NULL').get().count;
    console.log(`- Orders by guest (null customer_id): ${guestOrders}`);

    // Check for negative stock
    const negativeStock = db.prepare('SELECT COUNT(*) as count FROM products WHERE stock_quantity < 0').get().count;
    console.log(`- Products with negative stock: ${negativeStock}`);

    // Check for orders without items (empty items string or no order_items rows)
    const emptyOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE items = "" OR items IS NULL').get().count;
    console.log(`- Orders with empty items field: ${emptyOrders}`);

    db.close();
    console.log('\nAnalysis Complete.');

} catch (error) {
    console.error('Error during analysis:', error);
}
