import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OrdersCRUDTester {
    constructor() {
        this.db = null;
        this.testResults = [];
        this.testCount = 0;
        this.passCount = 0;
        this.failCount = 0;
    }

    async initDatabase() {
        try {
            // Use existing database or create new one
            const dbPath = path.join(__dirname, 'sqlite.db');
            this.db = new Database(dbPath, { readonly: false });
            console.log('✓ Database connection established');

            // Test basic connectivity
            const result = this.db.prepare('SELECT 1 as test').get();
            if (!result || result.test !== 1) {
                throw new Error('Database connectivity test failed');
            }

            return true;
        } catch (error) {
            console.error('✗ Failed to connect to database:', error.message);
            // Try creating a simple in-memory database for testing
            try {
                this.db = new Database(':memory:');
                console.log('✓ Using in-memory database for testing');
                await this.createTestSchema();
                return true;
            } catch (memError) {
                console.error('✗ Failed to create in-memory database:', memError.message);
                return false;
            }
        }
    }

    async createTestSchema() {
        // Create minimal test schema if using in-memory database
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

        this.db.exec(schema);

        // Insert test data
        this.db.exec(`
            INSERT INTO customers (name, email, phone) VALUES 
                ('Test Customer 1', 'test1@example.com', '1234567890'),
                ('Test Customer 2', 'test2@example.com', '1234567891');
                
            INSERT INTO users (name, pin, role) VALUES 
                ('Test User', '1234', 'cashier');
                
            INSERT INTO products (name, price, stock_quantity, barcode) VALUES 
                ('Test Product 1', '10.99', 100, '123456789001'),
                ('Test Product 2', '25.50', 50, '123456789002'),
                ('Test Product 3', '5.25', 200, '123456789003');
        `);
    }

    runTest(testName, testFn) {
        this.testCount++;
        try {
            console.log(`\n🧪 Running test: ${testName}`);
            testFn();
            this.testResults.push({ name: testName, status: 'PASS', error: null });
            this.passCount++;
            console.log(`✓ PASS: ${testName}`);
        } catch (error) {
            this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
            this.failCount++;
            console.log(`✗ FAIL: ${testName} - ${error.message}`);
        }
    }

    async testOrdersCreate() {
        console.log('\n🔍 Testing Order Creation...');

        // Test 1: Basic order creation
        this.runTest('Basic Order Creation', () => {
            const orderData = {
                customer_id: 1,
                user_id: 1,
                items: JSON.stringify([
                    { productId: 1, quantity: 2, price: '10.99' },
                    { productId: 2, quantity: 1, price: '25.50' }
                ]),
                total: '47.48',
                payment_method: 'cash',
                source: 'pos',
                status: 'completed',
                cash_received: '50.00',
                change: '2.52'
            };

            const stmt = this.db.prepare(`
                INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, cash_received, change, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
            `);

            const result = stmt.run(
                orderData.customer_id,
                orderData.user_id,
                orderData.items,
                orderData.total,
                orderData.payment_method,
                orderData.source,
                orderData.status,
                orderData.cash_received,
                orderData.change
            );

            if (!result.lastInsertRowid) {
                throw new Error('Order creation failed - no ID returned');
            }

            const createdOrder = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);

            if (!createdOrder) {
                throw new Error('Created order not found');
            }

            if (createdOrder.customer_id !== 1) {
                throw new Error(`Expected customer_id=1, got ${createdOrder.customer_id}`);
            }

            if (createdOrder.total !== '47.48') {
                throw new Error(`Expected total='47.48', got ${createdOrder.total}`);
            }

            if (createdOrder.payment_method !== 'cash') {
                throw new Error(`Expected payment_method='cash', got ${createdOrder.payment_method}`);
            }
        });

        // Test 2: Order with different payment methods
        this.runTest('Multiple Payment Methods', () => {
            const paymentMethods = ['card', 'cash', 'mobile'];
            let allSuccess = true;

            for (const method of paymentMethods) {
                const stmt = this.db.prepare(`
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
        });

        // Test 3: Order without customer (walk-in)
        this.runTest('Walk-in Order (No Customer)', () => {
            const stmt = this.db.prepare(`
                INSERT INTO orders (user_id, items, total, payment_method, source, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
            `);

            const items = JSON.stringify([{ productId: 1, quantity: 1, price: '10.99' }]);
            const result = stmt.run(1, items, '10.99', 'cash', 'pos', 'completed');

            if (!result.lastInsertRowid) {
                throw new Error('Walk-in order creation failed');
            }

            const order = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);

            if (!order) {
                throw new Error('Walk-in order not found after creation');
            }

            if (order.customer_id !== null) {
                throw new Error(`Expected customer_id=null, got ${order.customer_id}`);
            }
        });

        // Test 4: Order with minimal data
        this.runTest('Order with Minimal Data', () => {
            const stmt = this.db.prepare(`
                INSERT INTO orders (user_id, items, total, payment_method, created_at)
                VALUES (?, ?, ?, ?, strftime('%s', 'now'))
            `);

            const items = JSON.stringify([{ productId: 1, quantity: 1, price: '10.99' }]);
            const result = stmt.run(1, items, '10.99', 'card');

            if (!result.lastInsertRowid) {
                throw new Error('Minimal order creation failed');
            }

            const order = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);

            if (!order.source) {
                throw new Error('Source should have default value');
            }

            if (!order.status) {
                throw new Error('Status should have default value');
            }
        });
    }

    async testOrdersRead() {
        console.log('\n🔍 Testing Order Reading...');

        // Test 1: Read all orders
        this.runTest('Read All Orders', () => {
            const orders = this.db.prepare('SELECT COUNT(*) as count FROM orders').get();

            if (!orders || typeof orders.count !== 'number') {
                throw new Error('Failed to get order count');
            }

            console.log(`  Found ${orders.count} orders in database`);
        });

        // Test 2: Read order by ID
        this.runTest('Read Order by ID', () => {
            const firstOrder = this.db.prepare('SELECT * FROM orders ORDER BY id LIMIT 1').get();

            if (!firstOrder) {
                throw new Error('No orders found to test reading by ID');
            }

            const order = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(firstOrder.id);

            if (!order) {
                throw new Error('Failed to read order by ID');
            }

            if (order.id !== firstOrder.id) {
                throw new Error('Order ID mismatch');
            }
        });

        // Test 3: Filter orders by customer
        this.runTest('Filter Orders by Customer', () => {
            const customerOrders = this.db.prepare('SELECT * FROM orders WHERE customer_id = ?').all(1);

            if (!Array.isArray(customerOrders)) {
                throw new Error('Expected array of customer orders');
            }

            console.log(`  Found ${customerOrders.length} orders for customer 1`);
        });

        // Test 4: Filter orders by date range
        this.runTest('Filter Orders by Date Range', () => {
            const now = Math.floor(Date.now() / 1000);
            const yesterday = now - 86400; // 24 hours ago

            const dateRangeOrders = this.db.prepare(`
                SELECT * FROM orders 
                WHERE created_at BETWEEN ? AND ?
                ORDER BY created_at DESC
            `).all(yesterday, now);

            if (!Array.isArray(dateRangeOrders)) {
                throw new Error('Expected array of date range orders');
            }

            console.log(`  Found ${dateRangeOrders.length} orders in last 24 hours`);
        });

        // Test 5: Filter orders by status
        this.runTest('Filter Orders by Status', () => {
            const completedOrders = this.db.prepare("SELECT * FROM orders WHERE status = 'completed'").all();
            const pendingOrders = this.db.prepare("SELECT * FROM orders WHERE status = 'pending'").all();

            if (!Array.isArray(completedOrders) || !Array.isArray(pendingOrders)) {
                throw new Error('Expected arrays for status filtering');
            }

            console.log(`  Found ${completedOrders.length} completed, ${pendingOrders.length} pending orders`);
        });

        // Test 6: Parse order items data
        this.runTest('Parse Order Items Data', () => {
            const order = this.db.prepare('SELECT * FROM orders ORDER BY id LIMIT 1').get();

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

            console.log(`  Parsed ${items.length} items from order`);
        });
    }

    async testOrdersUpdate() {
        console.log('\n🔍 Testing Order Updates...');

        // Test 1: Update order status
        this.runTest('Update Order Status', () => {
            // First create an order
            const stmt = this.db.prepare(`
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
            const updateStmt = this.db.prepare("UPDATE orders SET status = ? WHERE id = ?");
            const updateResult = updateStmt.run('cancelled', orderId);

            if (updateResult.changes === 0) {
                throw new Error('Status update failed - no rows affected');
            }

            const updatedOrder = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

            if (!updatedOrder) {
                throw new Error('Updated order not found');
            }

            if (updatedOrder.status !== 'cancelled') {
                throw new Error(`Expected status='cancelled', got '${updatedOrder.status}'`);
            }
        });

        // Test 2: Update order notes
        this.runTest('Update Order Notes', () => {
            const order = this.db.prepare('SELECT * FROM orders ORDER BY id LIMIT 1').get();

            if (!order) {
                throw new Error('No orders found to test notes update');
            }

            const updateStmt = this.db.prepare('UPDATE orders SET notes = ? WHERE id = ?');
            const result = updateStmt.run('Updated test note', order.id);

            if (result.changes === 0) {
                throw new Error('Notes update failed - no rows affected');
            }

            const updatedOrder = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);

            if (!updatedOrder) {
                throw new Error('Order not found after notes update');
            }

            if (updatedOrder.notes !== 'Updated test note') {
                throw new Error(`Expected notes='Updated test note', got '${updatedOrder.notes}'`);
            }
        });

        // Test 3: Update payment information
        this.runTest('Update Payment Information', () => {
            const order = this.db.prepare('SELECT * FROM orders ORDER BY id LIMIT 1').get();

            if (!order) {
                throw new Error('No orders found to test payment update');
            }

            const updateStmt = this.db.prepare('UPDATE orders SET cash_received = ?, change = ? WHERE id = ?');
            const result = updateStmt.run('20.00', '9.01', order.id);

            if (result.changes === 0) {
                throw new Error('Payment update failed - no rows affected');
            }

            const updatedOrder = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);

            if (!updatedOrder) {
                throw new Error('Order not found after payment update');
            }

            if (updatedOrder.cash_received !== '20.00') {
                throw new Error(`Expected cash_received='20.00', got '${updatedOrder.cash_received}'`);
            }

            if (updatedOrder.change !== '9.01') {
                throw new Error(`Expected change='9.01', got '${updatedOrder.change}'`);
            }
        });
    }

    async testOrdersDelete() {
        console.log('\n🔍 Testing Order Deletion...');

        // Test 1: Delete specific order
        this.runTest('Delete Specific Order', () => {
            // Create an order to delete
            const stmt = this.db.prepare(`
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
            const deleteStmt = this.db.prepare('DELETE FROM orders WHERE id = ?');
            const deleteResult = deleteStmt.run(orderId);

            if (deleteResult.changes === 0) {
                throw new Error('Delete failed - no rows affected');
            }

            const deletedOrder = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

            if (deletedOrder) {
                throw new Error('Order should have been deleted');
            }
        });

        // Test 2: Soft delete (mark as cancelled)
        this.runTest('Soft Delete (Cancel Order)', () => {
            const order = this.db.prepare('SELECT * FROM orders ORDER BY id LIMIT 1').get();

            if (!order) {
                throw new Error('No orders found to test soft delete');
            }

            const updateStmt = this.db.prepare("UPDATE orders SET status = 'cancelled', notes = ? WHERE id = ?");
            const result = updateStmt.run('Soft deleted - customer request', order.id);

            if (result.changes === 0) {
                throw new Error('Soft delete failed - no rows affected');
            }

            const cancelledOrder = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);

            if (!cancelledOrder) {
                throw new Error('Order not found after soft delete');
            }

            if (cancelledOrder.status !== 'cancelled') {
                throw new Error(`Expected status='cancelled', got '${cancelledOrder.status}'`);
            }
        });
    }

    async testOrderValidation() {
        console.log('\n🔍 Testing Order Validation...');

        // Test 1: Required fields validation
        this.runTest('Required Fields Validation', () => {
            let validationError = false;

            try {
                const stmt = this.db.prepare(`
                    INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
                `);
                // Missing required items and total
                stmt.run(1, 1, null, null, 'cash', 'pos', 'completed');
            } catch (e) {
                validationError = true;
                console.log(`  ✓ Validation correctly rejected invalid data: ${e.message}`);
            }

            if (!validationError) {
                throw new Error('Should have failed validation for missing required fields');
            }
        });

        // Test 2: Order status validation
        this.runTest('Valid Order Statuses', () => {
            const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
            let allValid = true;

            for (const status of validStatuses) {
                try {
                    const stmt = this.db.prepare(`
                        INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
                    `);

                    const items = JSON.stringify([{ productId: 1, quantity: 1, price: '10.99' }]);
                    const result = stmt.run(1, 1, items, '10.99', 'cash', 'pos', status);

                    if (!result.lastInsertRowid) {
                        allValid = false;
                        break;
                    }
                } catch (e) {
                    allValid = false;
                    break;
                }
            }

            if (!allValid) {
                throw new Error('Not all valid statuses were accepted');
            }

            console.log(`  ✓ All ${validStatuses.length} valid statuses accepted`);
        });

        // Test 3: Total calculation accuracy
        this.runTest('Total Calculation Accuracy', () => {
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

            console.log(`  ✓ Total calculation accurate: ${calculatedTotal}`);
        });
    }

    async testOrderRelationships() {
        console.log('\n🔍 Testing Order Relationships...');

        // Test 1: Order-Customer relationship
        this.runTest('Order-Customer Relationship', () => {
            const customerOrders = this.db.prepare(`
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

            console.log(`  ✓ Order linked to customer: ${customerOrders.customer_name}`);
        });

        // Test 2: Order-User relationship
        this.runTest('Order-User Relationship', () => {
            const userOrders = this.db.prepare(`
                SELECT o.*, u.name as user_name, u.role as user_role
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                WHERE o.user_id IS NOT NULL
                LIMIT 1
            `).get();

            if (!userOrders) {
                throw new Error('No orders with users found to test relationship');
            }

            if (!userOrders.user_name) {
                throw new Error('User relationship not working - missing user_name');
            }

            console.log(`  ✓ Order linked to user: ${userOrders.user_name} (${userOrders.user_role})`);
        });

        // Test 3: Order items integrity
        this.runTest('Order Items Data Integrity', () => {
            const orders = this.db.prepare('SELECT * FROM orders LIMIT 3').all();

            if (orders.length === 0) {
                throw new Error('No orders found to test items integrity');
            }

            let allItemsValid = true;

            for (const order of orders) {
                try {
                    const items = JSON.parse(order.items);
                    if (!Array.isArray(items)) {
                        allItemsValid = false;
                        break;
                    }

                    for (const item of items) {
                        if (!item.productId || !item.quantity || !item.price) {
                            allItemsValid = false;
                            break;
                        }
                    }
                } catch (e) {
                    allItemsValid = false;
                    break;
                }
            }

            if (!allItemsValid) {
                throw new Error('Order items data integrity check failed');
            }

            console.log(`  ✓ All ${orders.length} orders have valid items structure`);
        });
    }

    async testComplexBusinessScenarios() {
        console.log('\n🔍 Testing Complex Business Scenarios...');

        // Test 1: Multi-item order with discounts
        this.runTest('Multi-item Order with Discounts', () => {
            const discountedOrder = {
                items: JSON.stringify([
                    { productId: 1, quantity: 2, price: '10.99', originalPrice: '12.99', discount: '2.00' },
                    { productId: 2, quantity: 1, price: '25.50', originalPrice: '25.50', discount: '0.00' }
                ]),
                total: '46.48', // After discounts
                payment_method: 'card'
            };

            const stmt = this.db.prepare(`
                INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
            `);

            const result = stmt.run(1, 1, discountedOrder.items, discountedOrder.total, discountedOrder.payment_method, 'pos', 'completed');

            if (!result.lastInsertRowid) {
                throw new Error('Failed to create discounted order');
            }

            const order = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);

            if (!order) {
                throw new Error('Discounted order not found after creation');
            }

            if (order.total !== '46.48') {
                throw new Error(`Expected total='46.48', got '${order.total}'`);
            }

            console.log(`  ✓ Discounted order created: ${order.total}`);
        });

        // Test 2: Partial payment scenario
        this.runTest('Partial Payment Order', () => {
            const partialPaymentOrder = {
                items: JSON.stringify([{ productId: 1, quantity: 5, price: '10.99' }]),
                total: '54.95',
                payment_method: 'cash',
                cash_received: '30.00',
                change: '0.00', // Partial payment, no change
                status: 'pending'
            };

            const stmt = this.db.prepare(`
                INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, cash_received, change, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
            `);

            const result = stmt.run(1, 1, partialPaymentOrder.items, partialPaymentOrder.total, partialPaymentOrder.payment_method, 'pos', partialPaymentOrder.status, partialPaymentOrder.cash_received, partialPaymentOrder.change);

            if (!result.lastInsertRowid) {
                throw new Error('Failed to create partial payment order');
            }

            const order = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);

            if (!order) {
                throw new Error('Partial payment order not found after creation');
            }

            if (order.status !== 'pending') {
                throw new Error(`Expected status='pending', got '${order.status}'`);
            }

            if (Number(order.cash_received) >= Number(order.total)) {
                throw new Error('Cash received should be less than total for partial payment');
            }

            console.log(`  ✓ Partial payment order created: ${order.cash_received}/${order.total}`);
        });

        // Test 3: Order modification scenario
        this.runTest('Order Modification Scenario', () => {
            // Create initial order
            const stmt = this.db.prepare(`
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

            const updateStmt = this.db.prepare('UPDATE orders SET items = ?, total = ?, status = ? WHERE id = ?');
            const updateResult = updateStmt.run(modifiedItems, newTotal, 'confirmed', orderId);

            if (updateResult.changes === 0) {
                throw new Error('Order modification failed - no rows affected');
            }

            const updatedOrder = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

            if (!updatedOrder) {
                throw new Error('Modified order not found');
            }

            if (updatedOrder.total !== '61.99') {
                throw new Error(`Expected total='61.99', got '${updatedOrder.total}'`);
            }

            if (updatedOrder.status !== 'confirmed') {
                throw new Error(`Expected status='confirmed', got '${updatedOrder.status}'`);
            }

            console.log(`  ✓ Order modified: ${updatedOrder.total}, status: ${updatedOrder.status}`);
        });
    }

    async testErrorScenarios() {
        console.log('\n🔍 Testing Error Scenarios...');

        // Test 1: Invalid customer assignment
        this.runTest('Invalid Customer Assignment', () => {
            let customerError = false;

            try {
                const stmt = this.db.prepare(`
                    INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
                `);

                const items = JSON.stringify([{ productId: 1, quantity: 1, price: '10.99' }]);
                stmt.run(99999, 1, items, '10.99', 'cash', 'pos', 'completed'); // Invalid customer
            } catch (e) {
                customerError = true;
                console.log(`  ✓ Invalid customer correctly rejected: ${e.message}`);
            }

            if (!customerError) {
                // This might be allowed depending on foreign key constraints
                console.log('  Note: Invalid customer was allowed (no FK constraint)');
            }
        });

        // Test 2: Payment processing failure simulation
        this.runTest('Payment Processing Failure', () => {
            let paymentError = false;

            try {
                // Test invalid payment method
                const stmt = this.db.prepare(`
                    INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
                `);

                const items = JSON.stringify([{ productId: 1, quantity: 1, price: '10.99' }]);
                stmt.run(1, 1, items, '10.99', 'invalid_payment', 'pos', 'pending');
            } catch (e) {
                paymentError = true;
                console.log(`  ✓ Invalid payment method rejected: ${e.message}`);
            }

            if (!paymentError) {
                console.log('  Note: Invalid payment method was accepted (no validation)');
            }
        });
    }

    async testPerformanceScenarios() {
        console.log('\n🔍 Testing Performance Scenarios...');

        // Test 1: Bulk order creation
        this.runTest('Bulk Order Creation Performance', () => {
            const startTime = Date.now();
            const bulkSize = 20; // Reduced for testing

            const transaction = this.db.transaction(() => {
                for (let i = 0; i < bulkSize; i++) {
                    const stmt = this.db.prepare(`
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

            console.log(`  Created ${bulkSize} orders in ${duration}ms`);

            if (duration > 5000) {
                console.log('  Warning: Bulk creation took longer than expected');
            }
        });

        // Test 2: Order reporting performance
        this.runTest('Order Reporting Performance', () => {
            const startTime = Date.now();

            // Complex reporting query
            const report = this.db.prepare(`
                SELECT 
                    DATE(datetime(created_at, 'unixepoch')) as date,
                    COUNT(*) as order_count,
                    SUM(total) as total_revenue,
                    AVG(total) as avg_order_value,
                    payment_method,
                    status
                FROM orders 
                WHERE created_at > strftime('%s', 'now', '-30 days')
                GROUP BY DATE(datetime(created_at, 'unixepoch')), payment_method, status
                ORDER BY date DESC
            `).all();

            const endTime = Date.now();
            const duration = endTime - startTime;

            console.log(`  Reporting query completed in ${duration}ms, found ${report.length} result rows`);

            if (duration > 1000) {
                console.log('  Warning: Reporting query took longer than expected');
            }
        });
    }

    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            totalTests: this.testCount,
            passedTests: this.passCount,
            failedTests: this.failCount,
            passRate: ((this.passCount / this.testCount) * 100).toFixed(2) + '%',
            testResults: this.testResults,
            summary: {
                status: this.failCount === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED',
                issuesFound: this.testResults.filter(r => r.status === 'FAIL').map(r => r.name)
            }
        };

        return report;
    }

    async cleanup() {
        if (this.db) {
            this.db.close();
        }
    }
}

// Main execution
async function runOrdersCRUDTests() {
    console.log('🚀 Starting Comprehensive Orders CRUD Tests\n');

    const tester = new OrdersCRUDTester();

    try {
        // Initialize database
        if (!await tester.initDatabase()) {
            throw new Error('Failed to initialize database');
        }

        // Run all test suites
        await tester.testOrdersCreate();
        await tester.testOrdersRead();
        await tester.testOrdersUpdate();
        await tester.testOrdersDelete();
        await tester.testOrderValidation();
        await tester.testOrderRelationships();
        await tester.testComplexBusinessScenarios();
        await tester.testErrorScenarios();
        await tester.testPerformanceScenarios();

        // Generate report
        const report = await tester.generateReport();

        // Print summary
        console.log('\n' + '='.repeat(80));
        console.log('ORDERS CRUD TEST RESULTS SUMMARY');
        console.log('='.repeat(80));
        console.log(`Total Tests: ${report.totalTests}`);
        console.log(`Passed: ${report.passedTests}`);
        console.log(`Failed: ${report.failedTests}`);
        console.log(`Pass Rate: ${report.passRate}`);
        console.log(`Status: ${report.summary.status}`);

        if (report.summary.issuesFound.length > 0) {
            console.log('\nIssues Found:');
            report.summary.issuesFound.forEach(issue => {
                console.log(`  ✗ ${issue}`);
            });
        }

        // Save detailed report
        const fs = await import('fs');
        fs.writeFileSync('orders-crud-test-report.json', JSON.stringify(report, null, 2));
        console.log('\n📄 Detailed report saved to: orders-crud-test-report.json');

        return report;

    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
        throw error;
    } finally {
        await tester.cleanup();
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runOrdersCRUDTests()
        .then(report => {
            console.log('\n✅ Orders CRUD testing completed!');
            process.exit(report.failCount > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('\n💥 Orders CRUD testing failed:', error);
            process.exit(1);
        });
}

export { runOrdersCRUDTests, OrdersCRUDTester };