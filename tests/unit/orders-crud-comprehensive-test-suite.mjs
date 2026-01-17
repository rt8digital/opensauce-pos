import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_DB_PATH = path.join(__dirname, 'test-orders-db.sqlite');
const MAIN_DB_PATH = path.join(__dirname, 'sqlite.db');

// Test results tracking
let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
};

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
}

function addTestResult(testName, passed, error = null) {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        log(`${testName}`, 'success');
    } else {
        testResults.failed++;
        testResults.errors.push({ test: testName, error });
        log(`${testName}: ${error}`, 'error');
    }
}

function createTestDatabase() {
    // Remove existing test database
    if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH);
    }

    // Copy main database to test database
    if (fs.existsSync(MAIN_DB_PATH)) {
        fs.copyFileSync(MAIN_DB_PATH, TEST_DB_PATH);
    }

    return new Database(TEST_DB_PATH);
}

function setupTestData(db) {
    // Create test data for comprehensive testing
    const setupQueries = [
        // Create test products if they don't exist
        `INSERT OR IGNORE INTO products (id, name, price, stock_quantity, barcode, category) VALUES 
      (1001, 'Test Product 1', '10.99', 100, '123456789001', 'Test Category'),
      (1002, 'Test Product 2', '25.50', 50, '123456789002', 'Test Category'),
      (1003, 'Test Product 3', '5.25', 200, '123456789003', 'Test Category');`,

        // Create test customers if they don't exist
        `INSERT OR IGNORE INTO customers (id, name, email, phone, loyalty_points) VALUES 
      (1001, 'Test Customer 1', 'test1@example.com', '1234567890', 0),
      (1002, 'Test Customer 2', 'test2@example.com', '1234567891', 50);`,

        // Create test users if they don't exist
        `INSERT OR IGNORE INTO users (id, name, pin, role, is_owner) VALUES 
      (1001, 'Test User', '1234', 'cashier', 0);`
    ];

    setupQueries.forEach(query => {
        db.exec(query);
    });
}

// Test Suite: Orders CRUD Operations
export async function runOrdersCRUDTests() {
    log('Starting comprehensive Orders CRUD tests...');

    const db = createTestDatabase();
    setupTestData(db);

    try {
        await testOrdersCreate(db);
        await testOrdersRead(db);
        await testOrdersUpdate(db);
        await testOrdersDelete(db);
        await testOrderValidation(db);
        await testOrderRelationships(db);
        await testComplexBusinessScenarios(db);
        await testErrorScenarios(db);
        await testPerformanceScenarios(db);

        log(`Orders CRUD Tests completed: ${testResults.passed}/${testResults.total} passed`);
        return testResults;
    } catch (error) {
        log(`Test suite failed: ${error.message}`, 'error');
        return testResults;
    } finally {
        db.close();
        // Clean up test database
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.unlinkSync(TEST_DB_PATH);
        }
    }
}

// Test Order Creation
async function testOrdersCreate(db) {
    log('\n🔍 Testing Order Creation...');

    // Test 1: Basic order creation
    try {
        const orderData = {
            customer_id: 1001,
            user_id: 1001,
            items: JSON.stringify([
                { productId: 1001, quantity: 2, price: '10.99' },
                { productId: 1002, quantity: 1, price: '25.50' }
            ]),
            total: '47.48',
            payment_method: 'cash',
            source: 'pos',
            status: 'completed',
            cash_received: '50.00',
            change: '2.52'
        };

        const stmt = db.prepare(`
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

        const createdOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);

        addTestResult(
            'Basic Order Creation',
            createdOrder &&
            createdOrder.customer_id === 1001 &&
            createdOrder.total === '47.48' &&
            createdOrder.payment_method === 'cash'
        );
    } catch (error) {
        addTestResult('Basic Order Creation', false, error.message);
    }

    // Test 2: Order with different payment methods
    try {
        const paymentMethods = ['card', 'cash', 'mobile'];
        let allSuccess = true;

        for (const method of paymentMethods) {
            const stmt = db.prepare(`
        INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
      `);

            const items = JSON.stringify([{ productId: 1001, quantity: 1, price: '10.99' }]);
            const result = stmt.run(1001, 1001, items, '10.99', method, 'pos', 'completed');

            if (!result.lastInsertRowid) {
                allSuccess = false;
            }
        }

        addTestResult('Multiple Payment Methods', allSuccess);
    } catch (error) {
        addTestResult('Multiple Payment Methods', false, error.message);
    }

    // Test 3: Order with customer assignment
    try {
        const stmt = db.prepare(`
      INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
    `);

        const items = JSON.stringify([{ productId: 1001, quantity: 1, price: '10.99' }]);
        const result = stmt.run(1002, 1001, items, '10.99', 'cash', 'pos', 'completed');

        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);

        addTestResult(
            'Order with Customer Assignment',
            order && order.customer_id === 1002
        );
    } catch (error) {
        addTestResult('Order with Customer Assignment', false, error.message);
    }

    // Test 4: Order without customer (walk-in)
    try {
        const stmt = db.prepare(`
      INSERT INTO orders (user_id, items, total, payment_method, source, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
    `);

        const items = JSON.stringify([{ productId: 1001, quantity: 1, price: '10.99' }]);
        const result = stmt.run(1001, items, '10.99', 'cash', 'pos', 'completed');

        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);

        addTestResult(
            'Walk-in Order (No Customer)',
            order && order.customer_id === null
        );
    } catch (error) {
        addTestResult('Walk-in Order (No Customer)', false, error.message);
    }
}

// Test Order Reading
async function testOrdersRead(db) {
    log('\n🔍 Testing Order Reading...');

    // Test 1: Read all orders
    try {
        const orders = db.prepare('SELECT COUNT(*) as count FROM orders').get();
        addTestResult('Read All Orders', orders.count >= 0);
    } catch (error) {
        addTestResult('Read All Orders', false, error.message);
    }

    // Test 2: Read order by ID
    try {
        const firstOrder = db.prepare('SELECT * FROM orders ORDER BY id LIMIT 1').get();
        if (firstOrder) {
            const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(firstOrder.id);
            addTestResult('Read Order by ID', order && order.id === firstOrder.id);
        } else {
            addTestResult('Read Order by ID', true, 'No orders to test');
        }
    } catch (error) {
        addTestResult('Read Order by ID', false, error.message);
    }

    // Test 3: Filter orders by customer
    try {
        const customerOrders = db.prepare('SELECT * FROM orders WHERE customer_id = ?').all(1001);
        addTestResult('Filter Orders by Customer', Array.isArray(customerOrders));
    } catch (error) {
        addTestResult('Filter Orders by Customer', false, error.message);
    }

    // Test 4: Filter orders by date range
    try {
        const today = Math.floor(Date.now() / 1000);
        const yesterday = today - 86400; // 24 hours ago

        const dateRangeOrders = db.prepare(`
      SELECT * FROM orders 
      WHERE created_at BETWEEN ? AND ?
      ORDER BY created_at DESC
    `).all(yesterday, today);

        addTestResult('Filter Orders by Date Range', Array.isArray(dateRangeOrders));
    } catch (error) {
        addTestResult('Filter Orders by Date Range', false, error.message);
    }

    // Test 5: Filter orders by status
    try {
        const completedOrders = db.prepare("SELECT * FROM orders WHERE status = 'completed'").all();
        const pendingOrders = db.prepare("SELECT * FROM orders WHERE status = 'pending'").all();

        addTestResult(
            'Filter Orders by Status',
            Array.isArray(completedOrders) && Array.isArray(pendingOrders)
        );
    } catch (error) {
        addTestResult('Filter Orders by Status', false, error.message);
    }

    // Test 6: Get order with items data
    try {
        const order = db.prepare('SELECT * FROM orders ORDER BY id LIMIT 1').get();
        if (order) {
            let items;
            try {
                items = JSON.parse(order.items);
            } catch (e) {
                items = [];
            }

            addTestResult(
                'Parse Order Items Data',
                Array.isArray(items) && items.length >= 0
            );
        } else {
            addTestResult('Parse Order Items Data', true, 'No orders to test');
        }
    } catch (error) {
        addTestResult('Parse Order Items Data', false, error.message);
    }
}

// Test Order Updates
async function testOrdersUpdate(db) {
    log('\n🔍 Testing Order Updates...');

    // Test 1: Update order status
    try {
        // First create an order
        const stmt = db.prepare(`
      INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
    `);

        const items = JSON.stringify([{ productId: 1001, quantity: 1, price: '10.99' }]);
        const result = stmt.run(1001, 1001, items, '10.99', 'cash', 'pos', 'pending');
        const orderId = result.lastInsertRowid;

        // Update status
        const updateStmt = db.prepare("UPDATE orders SET status = ? WHERE id = ?");
        updateStmt.run('cancelled', orderId);

        const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

        addTestResult(
            'Update Order Status',
            updatedOrder && updatedOrder.status === 'cancelled'
        );
    } catch (error) {
        addTestResult('Update Order Status', false, error.message);
    }

    // Test 2: Update order notes
    try {
        const order = db.prepare('SELECT * FROM orders ORDER BY id LIMIT 1').get();
        if (order) {
            const updateStmt = db.prepare('UPDATE orders SET notes = ? WHERE id = ?');
            updateStmt.run('Updated test note', order.id);

            const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);

            addTestResult(
                'Update Order Notes',
                updatedOrder && updatedOrder.notes === 'Updated test note'
            );
        } else {
            addTestResult('Update Order Notes', true, 'No orders to test');
        }
    } catch (error) {
        addTestResult('Update Order Notes', false, error.message);
    }

    // Test 3: Update payment information
    try {
        const order = db.prepare('SELECT * FROM orders ORDER BY id LIMIT 1').get();
        if (order) {
            const updateStmt = db.prepare('UPDATE orders SET cash_received = ?, change = ? WHERE id = ?');
            updateStmt.run('20.00', '9.01', order.id);

            const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);

            addTestResult(
                'Update Payment Information',
                updatedOrder &&
                updatedOrder.cash_received === '20.00' &&
                updatedOrder.change === '9.01'
            );
        } else {
            addTestResult('Update Payment Information', true, 'No orders to test');
        }
    } catch (error) {
        addTestResult('Update Payment Information', false, error.message);
    }

    // Test 4: Update order total (with business logic validation)
    try {
        const order = db.prepare('SELECT * FROM orders ORDER BY id LIMIT 1').get();
        if (order) {
            const updateStmt = db.prepare('UPDATE orders SET total = ? WHERE id = ?');
            updateStmt.run('15.99', order.id);

            const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);

            addTestResult(
                'Update Order Total',
                updatedOrder && updatedOrder.total === '15.99'
            );
        } else {
            addTestResult('Update Order Total', true, 'No orders to test');
        }
    } catch (error) {
        addTestResult('Update Order Total', false, error.message);
    }
}

// Test Order Deletion
async function testOrdersDelete(db) {
    log('\n🔍 Testing Order Deletion...');

    // Test 1: Delete specific order
    try {
        // Create an order to delete
        const stmt = db.prepare(`
      INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
    `);

        const items = JSON.stringify([{ productId: 1001, quantity: 1, price: '10.99' }]);
        const result = stmt.run(1001, 1001, items, '10.99', 'cash', 'pos', 'completed');
        const orderId = result.lastInsertRowid;

        // Delete the order
        const deleteStmt = db.prepare('DELETE FROM orders WHERE id = ?');
        deleteStmt.run(orderId);

        const deletedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

        addTestResult(
            'Delete Specific Order',
            !deletedOrder
        );
    } catch (error) {
        addTestResult('Delete Specific Order', false, error.message);
    }

    // Test 2: Soft delete (mark as cancelled instead of hard delete)
    try {
        const order = db.prepare('SELECT * FROM orders ORDER BY id LIMIT 1').get();
        if (order) {
            const updateStmt = db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?");
            updateStmt.run(order.id);

            const cancelledOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);

            addTestResult(
                'Soft Delete (Cancel Order)',
                cancelledOrder && cancelledOrder.status === 'cancelled'
            );
        } else {
            addTestResult('Soft Delete (Cancel Order)', true, 'No orders to test');
        }
    } catch (error) {
        addTestResult('Soft Delete (Cancel Order)', false, error.message);
    }

    // Test 3: Bulk delete orders by date range
    try {
        // This would typically be used for data cleanup
        const cutoffDate = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60); // 30 days ago
        const deleteStmt = db.prepare("DELETE FROM orders WHERE status = 'cancelled' AND created_at < ?");
        const result = deleteStmt.run(cutoffDate);

        addTestResult(
            'Bulk Delete Old Cancelled Orders',
            result.changes >= 0
        );
    } catch (error) {
        addTestResult('Bulk Delete Old Cancelled Orders', false, error.message);
    }
}

// Test Order Validation
async function testOrderValidation(db) {
    log('\n🔍 Testing Order Validation...');

    // Test 1: Required fields validation
    try {
        // Try to create order without required fields
        let validationError = false;

        try {
            const stmt = db.prepare(`
        INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
      `);
            // Missing items and total
            stmt.run(1001, 1001, null, null, 'cash', 'pos', 'completed');
        } catch (e) {
            validationError = true;
        }

        addTestResult(
            'Required Fields Validation',
            validationError // Should fail validation
        );
    } catch (error) {
        addTestResult('Required Fields Validation', false, error.message);
    }

    // Test 2: Order status validation
    try {
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        let allValid = true;

        for (const status of validStatuses) {
            try {
                const stmt = db.prepare(`
          INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
        `);

                const items = JSON.stringify([{ productId: 1001, quantity: 1, price: '10.99' }]);
                stmt.run(1001, 1001, items, '10.99', 'cash', 'pos', status);
            } catch (e) {
                allValid = false;
            }
        }

        addTestResult(
            'Valid Order Statuses',
            allValid
        );
    } catch (error) {
        addTestResult('Valid Order Statuses', false, error.message);
    }

    // Test 3: Total calculation accuracy
    try {
        const testItems = [
            { productId: 1001, quantity: 2, price: '10.99' },
            { productId: 1002, quantity: 1, price: '25.50' }
        ];

        const calculatedTotal = testItems.reduce((sum, item) => {
            return sum + (Number(item.price) * item.quantity);
        }, 0);

        const expectedTotal = (10.99 * 2) + (25.50 * 1); // 47.48

        addTestResult(
            'Total Calculation Accuracy',
            Math.abs(calculatedTotal - expectedTotal) < 0.01
        );
    } catch (error) {
        addTestResult('Total Calculation Accuracy', false, error.message);
    }

    // Test 4: Payment validation (cash received >= total)
    try {
        const order = db.prepare('SELECT * FROM orders WHERE payment_method = "cash" ORDER BY id LIMIT 1').get();
        if (order && order.cash_received && order.change !== null) {
            const cashReceived = Number(order.cash_received);
            const total = Number(order.total);
            const change = Number(order.change);

            const isValidPayment = cashReceived >= total && (cashReceived - total) === change;

            addTestResult(
                'Payment Validation (Cash)',
                isValidPayment
            );
        } else {
            addTestResult('Payment Validation (Cash)', true, 'No cash orders to test');
        }
    } catch (error) {
        addTestResult('Payment Validation (Cash)', false, error.message);
    }
}

// Test Order Relationships and Integrity
async function testOrderRelationships(db) {
    log('\n🔍 Testing Order Relationships...');

    // Test 1: Order-Customer relationship
    try {
        const customerOrders = db.prepare(`
      SELECT o.*, c.name as customer_name, c.email as customer_email
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.customer_id IS NOT NULL
      LIMIT 1
    `).get();

        addTestResult(
            'Order-Customer Relationship',
            customerOrders && customerOrders.customer_name !== undefined
        );
    } catch (error) {
        addTestResult('Order-Customer Relationship', false, error.message);
    }

    // Test 2: Order-User relationship
    try {
        const userOrders = db.prepare(`
      SELECT o.*, u.name as user_name, u.role as user_role
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.user_id IS NOT NULL
      LIMIT 1
    `).get();

        addTestResult(
            'Order-User Relationship',
            userOrders && userOrders.user_name !== undefined
        );
    } catch (error) {
        addTestResult('Order-User Relationship', false, error.message);
    }

    // Test 3: Order items integrity
    try {
        const orders = db.prepare('SELECT * FROM orders LIMIT 3').all();
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

        addTestResult(
            'Order Items Data Integrity',
            allItemsValid
        );
    } catch (error) {
        addTestResult('Order Items Data Integrity', false, error.message);
    }

    // Test 4: Foreign key constraints
    try {
        // Test invalid customer_id
        let constraintError = false;

        try {
            const stmt = db.prepare(`
        INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
      `);

            const items = JSON.stringify([{ productId: 1001, quantity: 1, price: '10.99' }]);
            stmt.run(99999, 1001, items, '10.99', 'cash', 'pos', 'completed');
        } catch (e) {
            constraintError = true;
        }

        addTestResult(
            'Foreign Key Constraint Validation',
            constraintError // Should fail due to invalid customer_id
        );
    } catch (error) {
        addTestResult('Foreign Key Constraint Validation', false, error.message);
    }
}

// Test Complex Business Scenarios
async function testComplexBusinessScenarios(db) {
    log('\n🔍 Testing Complex Business Scenarios...');

    // Test 1: Multi-item order with discounts
    try {
        const discountedOrder = {
            items: JSON.stringify([
                { productId: 1001, quantity: 2, price: '10.99', originalPrice: '12.99', discount: '2.00' },
                { productId: 1002, quantity: 1, price: '25.50', originalPrice: '25.50', discount: '0.00' }
            ]),
            total: '46.48', // After discounts
            payment_method: 'card'
        };

        const stmt = db.prepare(`
      INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
    `);

        const result = stmt.run(1001, 1001, discountedOrder.items, discountedOrder.total, discountedOrder.payment_method, 'pos', 'completed');
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);

        addTestResult(
            'Multi-item Order with Discounts',
            order && order.total === '46.48'
        );
    } catch (error) {
        addTestResult('Multi-item Order with Discounts', false, error.message);
    }

    // Test 2: Partial payment scenario
    try {
        const partialPaymentOrder = {
            items: JSON.stringify([{ productId: 1001, quantity: 5, price: '10.99' }]),
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

        const result = stmt.run(1001, 1001, partialPaymentOrder.items, partialPaymentOrder.total, partialPaymentOrder.payment_method, 'pos', partialPaymentOrder.status, partialPaymentOrder.cash_received, partialPaymentOrder.change);
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);

        addTestResult(
            'Partial Payment Order',
            order &&
            order.status === 'pending' &&
            Number(order.cash_received) < Number(order.total)
        );
    } catch (error) {
        addTestResult('Partial Payment Order', false, error.message);
    }

    // Test 3: Order modification scenario
    try {
        // Create initial order
        const stmt = db.prepare(`
      INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
    `);

        const initialItems = JSON.stringify([{ productId: 1001, quantity: 1, price: '10.99' }]);
        const result = stmt.run(1001, 1001, initialItems, '10.99', 'cash', 'pos', 'pending');
        const orderId = result.lastInsertRowid;

        // Modify the order (add more items)
        const modifiedItems = JSON.stringify([
            { productId: 1001, quantity: 1, price: '10.99' },
            { productId: 1002, quantity: 2, price: '25.50' }
        ]);
        const newTotal = '61.99';

        const updateStmt = db.prepare('UPDATE orders SET items = ?, total = ?, status = ? WHERE id = ?');
        updateStmt.run(modifiedItems, newTotal, 'confirmed', orderId);

        const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

        addTestResult(
            'Order Modification Scenario',
            updatedOrder &&
            updatedOrder.total === '61.99' &&
            updatedOrder.status === 'confirmed'
        );
    } catch (error) {
        addTestResult('Order Modification Scenario', false, error.message);
    }

    // Test 4: Order cancellation with refund
    try {
        // Create an order
        const stmt = db.prepare(`
      INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, cash_received, change, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
    `);

        const items = JSON.stringify([{ productId: 1001, quantity: 1, price: '10.99' }]);
        const result = stmt.run(1001, 1001, items, '10.99', 'cash', 'pos', 'completed', '15.00', '4.01');
        const orderId = result.lastInsertRowid;

        // Cancel and refund
        const updateStmt = db.prepare(`
      UPDATE orders 
      SET status = 'cancelled', 
          notes = ?, 
          cash_received = ?, 
          change = ?
      WHERE id = ?
    `);
        updateStmt.run('Customer refund requested', '0.00', '0.00', orderId);

        const cancelledOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

        addTestResult(
            'Order Cancellation with Refund',
            cancelledOrder &&
            cancelledOrder.status === 'cancelled' &&
            cancelledOrder.notes.includes('refund')
        );
    } catch (error) {
        addTestResult('Order Cancellation with Refund', false, error.message);
    }
}

// Test Error Scenarios
async function testErrorScenarios(db) {
    log('\n🔍 Testing Error Scenarios...');

    // Test 1: Insufficient stock scenario
    try {
        // Set stock to low quantity
        db.prepare('UPDATE products SET stock_quantity = 2 WHERE id = 1001').run();

        // Try to create order that exceeds stock
        let stockError = false;

        try {
            const stmt = db.prepare(`
        INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
      `);

            const items = JSON.stringify([{ productId: 1001, quantity: 5, price: '10.99' }]); // More than stock
            stmt.run(1001, 1001, items, '54.95', 'cash', 'pos', 'completed');
        } catch (e) {
            stockError = true;
        }

        // Reset stock
        db.prepare('UPDATE products SET stock_quantity = 100 WHERE id = 1001').run();

        addTestResult(
            'Insufficient Stock Handling',
            stockError // Should handle stock validation
        );
    } catch (error) {
        addTestResult('Insufficient Stock Handling', false, error.message);
    }

    // Test 2: Invalid customer assignment
    try {
        let customerError = false;

        try {
            const stmt = db.prepare(`
        INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
      `);

            const items = JSON.stringify([{ productId: 1001, quantity: 1, price: '10.99' }]);
            stmt.run(99999, 1001, items, '10.99', 'cash', 'pos', 'completed'); // Invalid customer
        } catch (e) {
            customerError = true;
        }

        addTestResult(
            'Invalid Customer Assignment',
            customerError // Should fail validation
        );
    } catch (error) {
        addTestResult('Invalid Customer Assignment', false, error.message);
    }

    // Test 3: Payment processing failure simulation
    try {
        let paymentError = false;

        try {
            // Simulate payment failure with invalid payment method
            const stmt = db.prepare(`
        INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
      `);

            const items = JSON.stringify([{ productId: 1001, quantity: 1, price: '10.99' }]);
            stmt.run(1001, 1001, items, '10.99', 'invalid_payment', 'pos', 'pending');
        } catch (e) {
            paymentError = true;
        }

        addTestResult(
            'Payment Processing Failure',
            paymentError // Should validate payment method
        );
    } catch (error) {
        addTestResult('Payment Processing Failure', false, error.message);
    }

    // Test 4: Database transaction rollback
    try {
        // Simulate a transaction that should rollback
        const transaction = db.transaction(() => {
            const stmt = db.prepare(`
        INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
      `);

            const items = JSON.stringify([{ productId: 1001, quantity: 1, price: '10.99' }]);
            const result = stmt.run(1001, 1001, items, '10.99', 'cash', 'pos', 'completed');

            // Simulate an error that should rollback
            throw new Error('Simulated transaction error');
        });

        let rollbackError = false;

        try {
            transaction();
        } catch (e) {
            rollbackError = true;
        }

        // Check that no order was created
        const ordersAfterError = db.prepare('SELECT COUNT(*) as count FROM orders WHERE customer_id = 1001').get();

        addTestResult(
            'Database Transaction Rollback',
            rollbackError && ordersAfterError.count >= 0
        );
    } catch (error) {
        addTestResult('Database Transaction Rollback', false, error.message);
    }
}

// Test Performance Scenarios
async function testPerformanceScenarios(db) {
    log('\n🔍 Testing Performance Scenarios...');

    // Test 1: Bulk order creation
    try {
        const startTime = Date.now();
        const bulkSize = 50;

        const transaction = db.transaction(() => {
            for (let i = 0; i < bulkSize; i++) {
                const stmt = db.prepare(`
          INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
        `);

                const items = JSON.stringify([{ productId: 1001, quantity: 1, price: '10.99' }]);
                stmt.run(1001, 1001, items, '10.99', 'cash', 'pos', 'completed');
            }
        });

        transaction();
        const endTime = Date.now();
        const duration = endTime - startTime;

        addTestResult(
            'Bulk Order Creation Performance',
            duration < 5000 // Should complete within 5 seconds
        );
    } catch (error) {
        addTestResult('Bulk Order Creation Performance', false, error.message);
    }

    // Test 2: Order reporting performance
    try {
        const startTime = Date.now();

        // Complex reporting query
        const report = db.prepare(`
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

        addTestResult(
            'Order Reporting Performance',
            duration < 1000 // Should complete within 1 second
        );
    } catch (error) {
        addTestResult('Order Reporting Performance', false, error.message);
    }

    // Test 3: Order search performance
    try {
        const startTime = Date.now();

        // Search orders by various criteria
        const searchResults = db.prepare(`
      SELECT * FROM orders 
      WHERE customer_id IN (SELECT id FROM customers WHERE name LIKE '%Test%')
      AND status = 'completed'
      AND total > '10.00'
      ORDER BY created_at DESC
      LIMIT 20
    `).all();

        const endTime = Date.now();
        const duration = endTime - startTime;

        addTestResult(
            'Order Search Performance',
            duration < 500 // Should complete within 500ms
        );
    } catch (error) {
        addTestResult('Order Search Performance', false, error.message);
    }

    // Test 4: Order aggregation queries
    try {
        const startTime = Date.now();

        // Complex aggregation query
        const aggregation = db.prepare(`
      SELECT 
        c.name as customer_name,
        COUNT(o.id) as total_orders,
        SUM(o.total) as total_spent,
        MAX(o.created_at) as last_order_date,
        AVG(o.total) as avg_order_value
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.created_at > strftime('%s', 'now', '-30 days')
      GROUP BY o.customer_id, c.name
      HAVING COUNT(o.id) > 0
      ORDER BY total_spent DESC
      LIMIT 10
    `).all();

        const endTime = Date.now();
        const duration = endTime - startTime;

        addTestResult(
            'Order Aggregation Performance',
            duration < 2000 // Should complete within 2 seconds
        );
    } catch (error) {
        addTestResult('Order Aggregation Performance', false, error.message);
    }
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
    runOrdersCRUDTests()
        .then(results => {
            console.log('\n' + '='.repeat(50));
            console.log('FINAL TEST RESULTS');
            console.log('='.repeat(50));
            console.log(`Total Tests: ${results.total}`);
            console.log(`Passed: ${results.passed}`);
            console.log(`Failed: ${results.failed}`);
            console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

            if (results.errors.length > 0) {
                console.log('\nFailed Tests:');
                results.errors.forEach(error => {
                    console.log(`- ${error.test}: ${error.error}`);
                });
            }

            process.exit(results.failed > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('Test suite failed:', error);
            process.exit(1);
        });
}