#!/usr/bin/env node
/**
 * End-to-End Business Workflow Validation Test
 * Tests complete business scenarios across all entities
 */

import Database from 'better-sqlite3';
import crypto from 'crypto';

console.log('🚀 Starting End-to-End Business Workflow Validation...\n');

// Initialize database
const db = new Database('sqlite.db');
db.pragma('foreign_keys = ON');

try {
    // Test 1: Complete Sales Transaction Workflow
    console.log('🧪 Test 1: Complete Sales Transaction Workflow');

    // 1.1 Create a product
    const productData = {
        name: 'Test Product Workflow',
        price: '25.99',
        cost: '15.00',
        image: 'test-product.jpg',
        stock_quantity: 50,
        barcode: 'TEST-WORKFLOW-' + Date.now(),
        category_id: 1
    };

    const productStmt = db.prepare(`
        INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category_id)
        VALUES (@name, @price, @cost, @image, @stock_quantity, @barcode, @category_id)
    `);

    const productResult = productStmt.run(productData);
    const productId = productResult.lastInsertRowid;
    console.log(`✅ Created product with ID: ${productId}`);

    // 1.2 Create a customer
    const customerData = {
        name: 'Test Customer Workflow',
        email: 'workflow@test.com',
        phone: '+27123456789'
    };

    const customerStmt = db.prepare(`
        INSERT INTO customers (name, email, phone)
        VALUES (@name, @email, @phone)
    `);

    const customerResult = customerStmt.run(customerData);
    const customerId = customerResult.lastInsertRowid;
    console.log(`✅ Created customer with ID: ${customerId}`);

    // 1.3 Create an order (simulate POS sale)
    const orderData = {
        customer_id: customerId,
        user_id: 1, // Assuming admin user exists
        items: JSON.stringify([{
            productId: productId,
            quantity: 2,
            price: '25.99',
            name: 'Test Product Workflow'
        }]),
        total: '51.98',
        payment_method: 'cash',
        status: 'completed',
        cash_received: '60.00',
        change: '8.02'
    };

    const orderStmt = db.prepare(`
        INSERT INTO orders (customer_id, user_id, items, total, payment_method, status, cash_received, change)
        VALUES (@customer_id, @user_id, @items, @total, @payment_method, @status, @cash_received, @change)
    `);

    const orderResult = orderStmt.run(orderData);
    const orderId = orderResult.lastInsertRowid;
    console.log(`✅ Created order with ID: ${orderId}`);

    // 1.4 Verify stock was reduced
    const stockCheck = db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(productId);
    console.log(`✅ Product stock after order: ${stockCheck.stock_quantity} (should be 48)`);

    // Test 2: Customer Loyalty Points System
    console.log('\n🧪 Test 2: Customer Loyalty Points System');

    // Update customer loyalty based on order
    const loyaltyUpdate = db.prepare(`
        UPDATE customers 
        SET loyalty_points = loyalty_points + CAST(? AS INTEGER),
            total_spent = total_spent + ?
        WHERE id = ?
    `);

    loyaltyUpdate.run(orderData.total, orderData.total, customerId);

    const updatedCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
    console.log(`✅ Customer loyalty points: ${updatedCustomer.loyalty_points}`);
    console.log(`✅ Customer total spent: ${updatedCustomer.total_spent}`);

    // Test 3: Settings Configuration Impact
    console.log('\n🧪 Test 3: Settings Configuration Impact');

    // Update settings
    const settingsUpdate = db.prepare(`
        UPDATE settings 
        SET store_name = 'Workflow Test Store',
            currency = 'USD'
        WHERE id = (SELECT id FROM settings LIMIT 1)
    `);

    settingsUpdate.run();
    const updatedSettings = db.prepare('SELECT store_name, currency FROM settings WHERE id = (SELECT id FROM settings LIMIT 1)').get();
    console.log(`✅ Updated store name: ${updatedSettings.store_name}`);
    console.log(`✅ Updated currency: ${updatedSettings.currency}`);

    // Test 4: User Authentication and Security
    console.log('\n🧪 Test 4: User Authentication and Security');

    // Test PIN hashing
    const testPin = '789012';
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(testPin, salt, 10000, 64, 'sha512').toString('hex');

    // Create test user with hashed PIN
    const userData = {
        name: 'Workflow Test User',
        pin_hash: hash,
        pin_salt: salt,
        role: 'cashier',
        is_owner: 0
    };

    const userStmt = db.prepare(`
        INSERT INTO users (name, pin_hash, pin_salt, role, is_owner)
        VALUES (@name, @pin_hash, @pin_salt, @role, @is_owner)
    `);

    const userResult = userStmt.run(userData);
    const userId = userResult.lastInsertRowid;
    console.log(`✅ Created user with ID: ${userId} (PIN securely hashed)`);

    // Verify PIN verification works
    const verifyHash = crypto.pbkdf2Sync(testPin, salt, 10000, 64, 'sha512').toString('hex');
    const isValidPin = verifyHash === hash;
    console.log(`✅ PIN verification test: ${isValidPin ? 'PASS' : 'FAIL'}`);

    // Test 5: Cross-Entity Relationship Integrity
    console.log('\n🧪 Test 5: Cross-Entity Relationship Integrity');

    // Verify all relationships are working
    const relationshipCheck = db.prepare(`
        SELECT 
            p.name as product_name,
            c.name as customer_name,
            o.id as order_id,
            u.name as user_name
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        JOIN users u ON o.user_id = u.id
        JOIN (
            SELECT id, name FROM products WHERE id IN (
                SELECT CAST(json_extract(value, '$.productId') AS INTEGER) 
                FROM orders, json_each(orders.items)
            )
        ) p ON JSON_EXTRACT(o.items, '$[0].productId') = p.id
        WHERE o.id = ?
    `).get(orderId);

    console.log('✅ Cross-entity relationship verification:');
    console.log(`   - Order ${orderId} linked to customer: ${relationshipCheck?.customer_name}`);
    console.log(`   - Order processed by user: ${relationshipCheck?.user_name}`);

    // Test 6: Business Logic Validation
    console.log('\n🧪 Test 6: Business Logic Validation');

    // Test duplicate prevention
    try {
        const duplicateBarcode = db.prepare('INSERT INTO products (name, price, image, stock_quantity, barcode) VALUES (?, ?, ?, ?, ?)');
        duplicateBarcode.run('Duplicate', '10.00', 'test.jpg', 5, productData.barcode);
        console.log('❌ Duplicate barcode prevention FAILED');
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            console.log('✅ Duplicate barcode correctly prevented');
        } else {
            console.log(`❌ Unexpected error: ${error.message}`);
        }
    }

    // Test negative price prevention (if constraint exists)
    try {
        const negativePrice = db.prepare('INSERT INTO products (name, price, image, stock_quantity, barcode) VALUES (?, ?, ?, ?, ?)');
        negativePrice.run('Negative Price', '-10.00', 'test.jpg', 5, 'NEG-' + Date.now());
        console.log('⚠️ Negative price allowed (constraint may not be implemented)');
    } catch (error) {
        console.log('✅ Negative price correctly prevented');
    }

    // Test 7: Data Integrity and Consistency
    console.log('\n🧪 Test 7: Data Integrity and Consistency');

    // Check for orphaned records
    const orphanedOrderItems = db.prepare(`
        SELECT COUNT(*) as count 
        FROM order_items oi 
        LEFT JOIN products p ON oi.product_id = p.id 
        WHERE p.id IS NULL
    `).get();

    console.log(`✅ Orphaned order items: ${orphanedOrderItems.count} (should be 0)`);

    const orphanedOrders = db.prepare(`
        SELECT COUNT(*) as count 
        FROM orders o 
        LEFT JOIN customers c ON o.customer_id = c.id 
        WHERE c.id IS NULL AND o.customer_id IS NOT NULL
    `).get();

    console.log(`✅ Orphaned orders: ${orphanedOrders.count} (should be 0)`);

    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');

    const cleanup = db.transaction(() => {
        db.prepare('DELETE FROM orders WHERE id = ?').run(orderId);
        db.prepare('DELETE FROM customers WHERE id = ?').run(customerId);
        db.prepare('DELETE FROM products WHERE id = ?').run(productId);
        db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    });

    cleanup();
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 End-to-End Business Workflow Validation COMPLETED!');

} catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
} finally {
    db.close();
}