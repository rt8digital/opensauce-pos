/**
 * Simplified Database Integrity Test - Debug Version
 */

import Database from 'better-sqlite3';

console.log('🚀 Starting simplified database integrity test...');

try {
    const db = new Database('sqlite.db');
    console.log('✅ Database connection established');

    // Test basic connectivity
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('📋 Found tables:', tables.map(t => t.name));

    // Test foreign key constraints
    console.log('\n🔍 Testing foreign key constraints...');

    const fkCheck = db.prepare('PRAGMA foreign_keys').get();
    console.log('🔗 Foreign keys enabled:', fkCheck);

    // Test basic relationships
    console.log('\n🔍 Testing basic relationships...');

    try {
        const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
        console.log('📦 Products count:', productCount.count);

        const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
        console.log('📂 Categories count:', categoryCount.count);

        const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get();
        console.log('👥 Customers count:', customerCount.count);

        const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get();
        console.log('🛒 Orders count:', orderCount.count);

    } catch (error) {
        console.log('❌ Error counting records:', error.message);
    }

    // Test constraint violations
    console.log('\n🔍 Testing constraint violations...');

    try {
        // Try to insert duplicate barcode
        db.prepare(`
            INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
            VALUES ('Test Product', '10.99', '5.50', 'test.jpg', 10, 'TEST123', 'Test')
        `).run();

        // Try again with same barcode
        db.prepare(`
            INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
            VALUES ('Test Product 2', '15.99', '7.50', 'test2.jpg', 15, 'TEST123', 'Test')
        `).run();

        console.log('⚠️  Duplicate barcode was allowed - constraint may not be enforced');

    } catch (error) {
        console.log('✅ Duplicate barcode correctly rejected:', error.message);
    }

    // Test foreign key violations
    console.log('\n🔍 Testing foreign key violations...');

    try {
        // Try to insert product with invalid category_id
        db.prepare(`
            INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category_id, category)
            VALUES ('Invalid FK Product', '10.99', '5.50', 'fk-test.jpg', 10, 'FK_TEST', 99999, 'Test')
        `).run();

        console.log('⚠️  Invalid category_id was allowed - FK constraint may not be enforced');

    } catch (error) {
        console.log('✅ Invalid category_id correctly rejected:', error.message);
    }

    db.close();
    console.log('\n✅ Simplified test completed!');

} catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
}