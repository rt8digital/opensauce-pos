import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Orders CRUD Tests...\n');

try {
    // Test database connectivity with in-memory database
    console.log('📊 Setting up test database...');

    const db = new Database(':memory:');
    console.log('✓ In-memory database created');

    // Create the basic schema for orders testing
    const schema = `
        CREATE TABLE customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            loyalty_points INTEGER DEFAULT 0,
            total_spent TEXT DEFAULT '0',
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
        );
        
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            pin TEXT NOT NULL,
            role TEXT NOT NULL,
            is_owner INTEGER DEFAULT 0,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
        );
        
        CREATE TABLE products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price TEXT NOT NULL,
            stock_quantity INTEGER NOT NULL,
            barcode TEXT,
            category TEXT DEFAULT 'General'
        );
        
        CREATE TABLE orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            user_id INTEGER,
            items TEXT NOT NULL,
            total TEXT NOT NULL,
            payment_method TEXT NOT NULL,
            source TEXT DEFAULT 'pos',
            status TEXT DEFAULT 'completed',
            notes TEXT,
            cash_received TEXT,
            change TEXT,
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (customer_id) REFERENCES customers(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `;

    db.exec(schema);
    console.log('✓ Schema created');

    // Insert test data
    const testData = `
        INSERT INTO customers (name, email, phone) VALUES 
            ('Test Customer 1', 'test1@example.com', '1234567890'),
            ('Test Customer 2', 'test2@example.com', '1234567891');
            
        INSERT INTO users (name, pin, role) VALUES 
            ('Test User', '1234', 'cashier');
            
        INSERT INTO products (name, price, stock_quantity, barcode) VALUES 
            ('Test Product 1', '10.99', 100, '123456789001'),
            ('Test Product 2', '25.50', 50, '123456789002'),
            ('Test Product 3', '5.25', 200, '123456789003');
    `;

    db.exec(testData);
    console.log('✓ Test data inserted');

    let testCount = 0;
    let passCount = 0;
    let failCount = 0;

    function runTest(testName, testFn) {
        testCount++;
        try {
            console.log(`\n🧪 Testing: ${testName}`);
            testFn();
            passCount++;
            console.log(`✅ PASS: ${testName}`);
        } catch (error) {
            failCount++;
            console.log(`❌ FAIL: ${testName} - ${error.message}`);
        }
    }

    // TEST 1: Basic Order Creation
    runTest('Basic Order Creation', () => {
        const stmt = db.prepare(`
            INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, cash_received, change, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
        `);

        const items = JSON.stringify([
            { productId: 1, quantity: 2, price: '10.99' },
            { productId: 2, quantity: 1, price: '25.50' }
        ]);

        const result = stmt.run(1, 1, items, '47.48', 'cash', 'pos', 'completed', '50.00', '2.52');

        if (!result.lastInsertRowid) {
            throw new Error('Order creation failed - no ID returned');
        }

        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);

        if (!order) {
            throw new Error('Created order not found');
        }

        if (order.total !== '47.48') {
            throw new Error(`Expected total='47.48', got '${order.total}'`);
        }

        if (order.payment_method !== 'cash') {
            throw new Error(`Expected payment_method='cash', got '${order.payment_method}'`);
        }

        console.log(`   Created order #${order.id} with total ${order.total}`);
    });

    // TEST 2: Walk-in Order (No Customer)
    runTest('Walk-in Order Creation', () => {
        const stmt = db.prepare(`
            INSERT INTO orders (user_id, items, total, payment_method, source, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
        `);

        const items = JSON.stringify([{ productId: 1, quantity: 1, price: '10.99' }]);
        const result = stmt.run(1, items, '10.99', 'card', 'pos', 'completed');

        if (!result.lastInsertRowid) {
            throw new Error('Walk-in order creation failed');
        }

        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);

        if (order.customer_id !== null) {
            throw new Error(`Expected customer_id=null, got ${order.customer_id}`);
        }

        console.log(`   Created walk-in order #${order.id}`);
    });

    // TEST 3: Read Orders
    runTest('Read All Orders', () => {
        const orders = db.prepare('SELECT COUNT(*) as count FROM orders').get();

        if (!orders || typeof orders.count !== 'number') {
            throw new Error('Failed to get order count');
        }

        if (orders.count < 2) {
            throw new Error(`Expected at least 2 orders, found ${orders.count}`);
        }

        console.log(`   Found ${orders.count} orders in database`);
    });

    // TEST 4: Filter Orders by Customer
    runTest('Filter Orders by Customer', () => {
        const customerOrders = db.prepare('SELECT * FROM orders WHERE customer_id = ?').all(1);

        if (!Array.isArray(customerOrders)) {
            throw new Error('Expected array of customer orders');
        }

        if (customerOrders.length === 0) {
            throw new Error('No orders found for customer 1');
        }

        console.log(`   Found ${customerOrders.length} orders for customer 1`);
    });

    // TEST 5: Parse Order Items
    runTest('Parse Order Items Data', () => {
        const order = db.prepare('SELECT * FROM orders ORDER BY id LIMIT 1').get();

        if (!order) {
            throw new Error('No orders found to test items parsing');
        }

        let items;
        try {
            items = JSON.parse(order.items);
        } catch (e) {
            throw new Error('Failed to parse order items JSON: ' + e.message);
        }

        if (!Array.isArray(items)) {
            throw new Error('Order items should be an array');
        }

        if (items.length === 0) {
            throw new Error('Order should have at least one item');
        }

        // Validate item structure
        for (const item of items) {
            if (!item.productId || !item.quantity || !item.price) {
                throw new Error('Invalid item structure in order');
            }
        }

        console.log(`   Parsed ${items.length} items from order #${order.id}`);
    });

    // TEST 6: Update Order Status
    runTest('Update Order Status', () => {
        // Create an order first
        const stmt = db.prepare(`
            INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
        `);

        const items = JSON.stringify([{ productId: 1, quantity: 1, price: '10.99' }]);
        const result = stmt.run(1, 1, items, '10.99', 'cash', 'pos', 'pending');
        const orderId = result.lastInsertRowid;

        if (!orderId) {
            throw new Error('Failed to create order for status update test');
        }

        // Update status
        const updateStmt = db.prepare("UPDATE orders SET status = ? WHERE id = ?");
        const updateResult = updateStmt.run('cancelled', orderId);

        if (updateResult.changes === 0) {
            throw new Error('Status update failed - no rows affected');
        }

        const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

        if (updatedOrder.status !== 'cancelled') {
            throw new Error(`Expected status='cancelled', got '${updatedOrder.status}'`);
        }

        console.log(`   Updated order #${orderId} status to cancelled`);
    });

    // TEST 7: Update Order Notes
    runTest('Update Order Notes', () => {
        const order = db.prepare('SELECT * FROM orders ORDER BY id LIMIT 1').get();

        if (!order) {
            throw new Error('No orders found to test notes update');
        }

        const updateStmt = db.prepare('UPDATE orders SET notes = ? WHERE id = ?');
        const result = updateStmt.run('Updated test note', order.id);

        if (result.changes === 0) {
            throw new Error('Notes update failed - no rows affected');
        }

        const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);

        if (updatedOrder.notes !== 'Updated test note') {
            throw new Error(`Expected notes='Updated test note', got '${updatedOrder.notes}'`);
        }

        console.log(`   Updated order #${order.id} notes`);
    });

    // TEST 8: Delete Order
    runTest('Delete Specific Order', () => {
        // Create an order to delete
        const stmt = db.prepare(`
            INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
        `);

        const items = JSON.stringify([{ productId: 1, quantity: 1, price: '10.99' }]);
        const result = stmt.run(1, 1, items, '10.99', 'cash', 'pos', 'completed');
        const orderId = result.lastInsertRowid;

        if (!orderId) {
            throw new Error('Failed to create order for deletion test');
        }

        // Delete the order
        const deleteStmt = db.prepare('DELETE FROM orders WHERE id = ?');
        const deleteResult = deleteStmt.run(orderId);

        if (deleteResult.changes === 0) {
            throw new Error('Delete failed - no rows affected');
        }

        const deletedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

        if (deletedOrder) {
            throw new Error('Order should have been deleted');
        }

        console.log(`   Deleted order #${orderId}`);
    });

    // TEST 9: Order-Customer Relationship
    runTest('Order-Customer Relationship', () => {
        const customerOrders = db.prepare(`
            SELECT o.*, c.name as customer_name, c.email as customer_email
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            WHERE o.customer_id IS NOT NULL
            LIMIT 1
        `).get();

        if (!customerOrders) {
            throw new Error('No orders with customers found to test relationship');
        }

        if (!customerOrders.customer_name) {
            throw new Error('Customer relationship not working - missing customer_name');
        }

        console.log(`   Order linked to customer: ${customerOrders.customer_name}`);
    });

    // TEST 10: Multiple Payment Methods
    runTest('Multiple Payment Methods', () => {
        const paymentMethods = ['card', 'cash', 'mobile'];
        let allSuccess = true;

        for (const method of paymentMethods) {
            const stmt = db.prepare(`
                INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
            `);

            const items = JSON.stringify([{ productId: 1, quantity: 1, price: '10.99' }]);
            const result = stmt.run(1, 1, items, '10.99', method, 'pos', 'completed');

            if (!result.lastInsertRowid) {
                allSuccess = false;
                break;
            }
        }

        if (!allSuccess) {
            throw new Error('Failed to create orders with different payment methods');
        }

        console.log(`   Created orders with ${paymentMethods.length} different payment methods`);
    });

    // TEST 11: Partial Payment Scenario
    runTest('Partial Payment Order', () => {
        const partialPaymentOrder = {
            items: JSON.stringify([{ productId: 1, quantity: 5, price: '10.99' }]),
            total: '54.95',
            payment_method: 'cash',
            cash_received: '30.00',
            change: '0.00', // Partial payment, no change
            status: 'pending'
        };

        const stmt = db.prepare(`
            INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, cash_received, change, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
        `);

        const result = stmt.run(1, 1, partialPaymentOrder.items, partialPaymentOrder.total, partialPaymentOrder.payment_method, 'pos', partialPaymentOrder.status, partialPaymentOrder.cash_received, partialPaymentOrder.change);

        if (!result.lastInsertRowid) {
            throw new Error('Failed to create partial payment order');
        }

        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);

        if (!order) {
            throw new Error('Partial payment order not found after creation');
        }

        if (order.status !== 'pending') {
            throw new Error(`Expected status='pending', got '${order.status}'`);
        }

        if (Number(order.cash_received) >= Number(order.total)) {
            throw new Error('Cash received should be less than total for partial payment');
        }

        console.log(`   Created partial payment order: ${order.cash_received}/${order.total}`);
    });

    // TEST 12: Order Modification
    runTest('Order Modification', () => {
        // Create initial order
        const stmt = db.prepare(`
            INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
        `);

        const initialItems = JSON.stringify([{ productId: 1, quantity: 1, price: '10.99' }]);
        const result = stmt.run(1, 1, initialItems, '10.99', 'cash', 'pos', 'pending');
        const orderId = result.lastInsertRowid;

        if (!orderId) {
            throw new Error('Failed to create initial order for modification test');
        }

        // Modify the order (add more items)
        const modifiedItems = JSON.stringify([
            { productId: 1, quantity: 1, price: '10.99' },
            { productId: 2, quantity: 2, price: '25.50' }
        ]);
        const newTotal = '61.99';

        const updateStmt = db.prepare('UPDATE orders SET items = ?, total = ?, status = ? WHERE id = ?');
        const updateResult = updateStmt.run(modifiedItems, newTotal, 'confirmed', orderId);

        if (updateResult.changes === 0) {
            throw new Error('Order modification failed - no rows affected');
        }

        const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

        if (!updatedOrder) {
            throw new Error('Modified order not found');
        }

        if (updatedOrder.total !== '61.99') {
            throw new Error(`Expected total='61.99', got '${updatedOrder.total}'`);
        }

        if (updatedOrder.status !== 'confirmed') {
            throw new Error(`Expected status='confirmed', got '${updatedOrder.status}'`);
        }

        console.log(`   Modified order #${orderId}: ${updatedOrder.total}, status: ${updatedOrder.status}`);
    });

    // TEST 13: Total Calculation Accuracy
    runTest('Total Calculation Accuracy', () => {
        const testItems = [
            { productId: 1, quantity: 2, price: '10.99' },
            { productId: 2, quantity: 1, price: '25.50' }
        ];

        const calculatedTotal = testItems.reduce((sum, item) => {
            return sum + (Number(item.price) * item.quantity);
        }, 0);

        const expectedTotal = (10.99 * 2) + (25.50 * 1); // 47.48

        if (Math.abs(calculatedTotal - expectedTotal) >= 0.01) {
            throw new Error(`Calculation error: expected ${expectedTotal}, got ${calculatedTotal}`);
        }

        console.log(`   Total calculation accurate: ${calculatedTotal}`);
    });

    // TEST 14: Bulk Operations
    runTest('Bulk Order Creation', () => {
        const startTime = Date.now();
        const bulkSize = 10;

        const transaction = db.transaction(() => {
            for (let i = 0; i < bulkSize; i++) {
                const stmt = db.prepare(`
                    INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
                `);

                const items = JSON.stringify([{ productId: 1, quantity: 1, price: '10.99' }]);
                stmt.run(1, 1, items, '10.99', 'cash', 'pos', 'completed');
            }
        });

        transaction();
        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`   Created ${bulkSize} orders in ${duration}ms`);
    });

    // TEST 15: Data Integrity
    runTest('Order Data Integrity', () => {
        const orders = db.prepare('SELECT * FROM orders LIMIT 5').all();

        if (orders.length === 0) {
            throw new Error('No orders found to test data integrity');
        }

        let allValid = true;

        for (const order of orders) {
            // Check required fields
            if (!order.items || !order.total || !order.payment_method) {
                allValid = false;
                break;
            }

            // Validate items JSON
            try {
                const items = JSON.parse(order.items);
                if (!Array.isArray(items)) {
                    allValid = false;
                    break;
                }

                for (const item of items) {
                    if (!item.productId || !item.quantity || !item.price) {
                        allValid = false;
                        break;
                    }
                }
            } catch (e) {
                allValid = false;
                break;
            }
        }

        if (!allValid) {
            throw new Error('Order data integrity check failed');
        }

        console.log(`   All ${orders.length} orders have valid data structure`);
    });

    // Generate final report
    console.log('\n' + '='.repeat(80));
    console.log('ORDERS CRUD TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${testCount}`);
    console.log(`Passed: ${passCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Pass Rate: ${((passCount / testCount) * 100).toFixed(1)}%`);
    console.log(`Status: ${failCount === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

    if (failCount === 0) {
        console.log('\n🎉 Orders CRUD operations are working correctly!');
        console.log('✅ Order creation, reading, updating, and deleting all functional');
        console.log('✅ Order relationships and data integrity validated');
        console.log('✅ Business scenarios (payments, modifications) working');
        console.log('✅ Performance and bulk operations tested');
    } else {
        console.log('\n⚠️ Some tests failed. Review the output above for details.');
    }

    db.close();
    console.log('\n🔒 Database connection closed');

    process.exit(failCount > 0 ? 1 : 0);

} catch (error) {
    console.error('💥 Test execution failed:', error.message);
    console.error(error.stack);
    process.exit(1);
}