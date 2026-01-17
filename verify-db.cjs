/**
 * Verify migrated database contents
 */

const Database = require('better-sqlite3');
const path = require('path');

const projectRoot = process.cwd();
const dbPath = path.join(projectRoot, 'sqlite.db');

const db = new Database(dbPath);

console.log('=== MIGRATED DATABASE VERIFICATION ===\n');

// Get summary of each table
const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all();

for (const table of tables) {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
    console.log(`${table.name}: ${count.count} rows`);
}

console.log('\n=== KEY DATA SAMPLES ===\n');

// Show store info
const storeInfo = db.prepare(`SELECT store_name, store_address, store_phone, currency, theme FROM settings LIMIT 1`).get();
console.log('Store Info:');
console.log('  Name:', storeInfo?.store_name);
console.log('  Address:', storeInfo?.store_address);
console.log('  Phone:', storeInfo?.store_phone);
console.log('  Currency:', storeInfo?.currency);
console.log('  Theme:', storeInfo?.theme);

// Show users
console.log('\nUsers:');
const users = db.prepare(`SELECT id, name, role FROM users`).all();
users.forEach(u => {
    console.log(`  - ${u.name} (${u.role})`);
});

// Show product count
console.log('\nProducts:');
const products = db.prepare(`SELECT COUNT(*) as total, SUM(stock_quantity) as total_stock FROM products`).get();
console.log(`  Total products: ${products.total}`);
console.log(`  Total stock units: ${products.total_stock}`);

// Show recent orders
console.log('\nRecent Orders:');
const orders = db.prepare(`
    SELECT COUNT(*) as total_orders, SUM(CAST(total AS REAL)) as total_sales
    FROM orders
`).get();
console.log(`  Total orders: ${orders.total_orders}`);
console.log(`  Total sales: R${parseFloat(orders.total_sales).toFixed(2)}`);

// Show categories
console.log('\nCategories:');
const categories = db.prepare(`SELECT id, name FROM categories`).all();
categories.forEach(c => {
    console.log(`  - ${c.name}`);
});

console.log('\n✓ Migration verification complete!');
db.close();
