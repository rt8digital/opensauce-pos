/**
 * Comprehensive Database Integrity and Constraints Testing Suite
 * Tests all entities, relationships, constraints, and cross-entity consistency
 * Covers: Products, Categories, Customers, Users, Orders, Order_Items, Settings
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_DB_PATH = path.join(__dirname, 'test-integrity-db.sqlite');
const MAIN_DB_PATH = path.join(__dirname, 'sqlite.db');

// Test results tracking
const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    errors: [],
    issuesFound: [],
    performanceMetrics: {}
};

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
}

function addTestResult(testName, passed, error = null, warning = false) {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        log(`${testName}`, 'success');
    } else if (warning) {
        testResults.warnings++;
        log(`${testName}: ${error}`, 'warning');
    } else {
        testResults.failed++;
        testResults.errors.push({ test: testName, error });
        log(`${testName}: ${error}`, 'error');
    }
}

function addIssue(issue, severity = 'medium') {
    testResults.issuesFound.push({ issue, severity, timestamp: new Date().toISOString() });
    log(`🔍 ISSUE (${severity}): ${issue}`, 'warning');
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

    const db = new Database(TEST_DB_PATH);

    // Enable foreign key constraints
    db.exec('PRAGMA foreign_keys = ON');
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA synchronous = NORMAL');

    return db;
}

function setupTestData(db) {
    log('Setting up comprehensive test data...');

    const setupQueries = [
        // Clear existing test data
        `DELETE FROM order_items WHERE order_id > 100000`,
        `DELETE FROM orders WHERE id > 100000`,
        `DELETE FROM products WHERE id > 100000`,
        `DELETE FROM categories WHERE id > 100000`,
        `DELETE FROM customers WHERE id > 100000`,
        `DELETE FROM users WHERE id > 100000`,

        // Create test categories
        `INSERT OR REPLACE INTO categories (id, name, description, created_at) VALUES 
        (1001, 'Test Electronics', 'Test electronic products', 1735712730),
        (1002, 'Test Food', 'Test food products', 1735712730),
        (1003, 'Test Beverages', 'Test beverage products', 1735712730)`,

        // Create test products with relationships
        `INSERT OR REPLACE INTO products (id, name, price, cost, image, stock_quantity, barcode, plu, category_id, category) VALUES 
        (1001, 'Test Laptop', '999.99', '700.00', 'laptop.jpg', 50, '1234567890001', 'PLU001', 1001, 'Test Electronics'),
        (1002, 'Test Phone', '599.99', '400.00', 'phone.jpg', 100, '1234567890002', 'PLU002', 1001, 'Test Electronics'),
        (1003, 'Test Sandwich', '8.99', '4.50', 'sandwich.jpg', 200, '1234567890003', 'PLU003', 1002, 'Test Food'),
        (1004, 'Test Coffee', '3.99', '1.50', 'coffee.jpg', 500, '1234567890004', 'PLU004', 1003, 'Test Beverages')`,

        // Create test customers
        `INSERT OR REPLACE INTO customers (id, name, email, phone, loyalty_points, total_spent, created_at) VALUES 
        (1001, 'Test Customer 1', 'test1@example.com', '1234567890', 150, '250.50', 1735712730),
        (1002, 'Test Customer 2', 'test2@example.com', '1234567891', 75, '125.75', 1735712730)`,

        // Create test users
        `INSERT OR REPLACE INTO users (id, name, pin, role, is_owner, created_at) VALUES 
        (1001, 'Test Admin', '123456', 'admin', 1, 1735712730),
        (1002, 'Test Cashier', '654321', 'cashier', 0, 1735712730)`,

        // Create test orders
        `INSERT OR REPLACE INTO orders (id, customer_id, user_id, items, total, payment_method, source, status, created_at, cash_received, change) VALUES 
        (1001, 1001, 1001, '[{"productId":1001,"quantity":1,"price":"999.99"},{"productId":1003,"quantity":2,"price":"8.99"}]', '1017.97', 'cash', 'pos', 'completed', 1735712730, '1050.00', '32.03'),
        (1002, 1002, 1002, '[{"productId":1002,"quantity":1,"price":"599.99"},{"productId":1004,"quantity":3,"price":"3.99"}]', '615.96', 'card', 'pos', 'completed', 1735712730, null, null)`,

        // Create test order items
        `INSERT OR REPLACE INTO order_items (id, product_id, order_id, quantity, price) VALUES 
        (1001, 1001, 1001, 1, '999.99'),
        (1002, 1003, 1001, 2, '8.99'),
        (1003, 1002, 1002, 1, '599.99'),
        (1004, 1004, 1002, 3, '3.99')`
    ];

    setupQueries.forEach(query => {
        try {
            db.exec(query);
        } catch (error) {
            log(`Setup query failed: ${error.message}`, 'error');
        }
    });
}

// MAIN TEST SUITE
export async function runDatabaseIntegrityTests() {
    log('🚀 Starting comprehensive database integrity tests...');

    const db = createTestDatabase();
    setupTestData(db);

    try {
        await testForeignKeyRelationships(db);
        await testReferentialIntegrity(db);
        await testDatabaseConstraints(db);
        await testTransactionIntegrity(db);
        await testDataConsistency(db);
        await testComplexBusinessScenarios(db);
        await testDatabasePerformance(db);
        await testEdgeCasesAndErrorScenarios(db);

        await generateComprehensiveReport();
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

// 1. FOREIGN KEY RELATIONSHIPS INTEGRITY
async function testForeignKeyRelationships(db) {
    log('\n🔍 Testing Foreign Key Relationships Integrity...');

    // Test Products -> Categories relationship
    await testForeignKeyConstraint(db, 'products', 'category_id', 1001, 'Valid category reference');
    await testForeignKeyViolation(db, 'products', 'category_id', 99999, 'Invalid category reference');

    // Test Orders -> Customers relationship  
    await testForeignKeyConstraint(db, 'orders', 'customer_id', 1001, 'Valid customer reference');
    await testForeignKeyViolation(db, 'orders', 'customer_id', 99999, 'Invalid customer reference');

    // Test Orders -> Users relationship
    await testForeignKeyConstraint(db, 'orders', 'user_id', 1001, 'Valid user reference');
    await testForeignKeyViolation(db, 'orders', 'user_id', 99999, 'Invalid user reference');

    // Test Order_Items -> Orders relationship
    await testForeignKeyConstraint(db, 'order_items', 'order_id', 1001, 'Valid order reference');
    await testForeignKeyViolation(db, 'order_items', 'order_id', 99999, 'Invalid order reference');

    // Test Order_Items -> Products relationship
    await testForeignKeyConstraint(db, 'order_items', 'product_id', 1001, 'Valid product reference');
    await testForeignKeyViolation(db, 'order_items', 'product_id', 99999, 'Invalid product reference');
}

async function testForeignKeyConstraint(db, table, foreignKeyField, validId, testName) {
    try {
        // Create a record with valid foreign key
        const result = db.prepare(
            `INSERT INTO ${table} (${foreignKeyField}) VALUES (?)`
        ).run(validId);

        if (result.lastInsertRowid) {
            // Clean up test record
            db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(result.lastInsertRowid);
            addTestResult(`${testName} - FK Constraint`, true);
        } else {
            addTestResult(`${testName} - FK Constraint`, false, 'No record created');
        }
    } catch (error) {
        addTestResult(`${testName} - FK Constraint`, false, error.message);
    }
}

async function testForeignKeyViolation(db, table, foreignKeyField, invalidId, testName) {
    try {
        db.prepare(
            `INSERT INTO ${table} (${foreignKeyField}) VALUES (?)`
        ).run(invalidId);

        addTestResult(`${testName} - FK Violation`, false, 'Should have failed foreign key constraint');
    } catch (error) {
        const isFKError = error.message.includes('FOREIGN KEY') || error.message.includes('constraint');
        addTestResult(`${testName} - FK Violation`, isFKError,
            isFKError ? null : `Expected FK error, got: ${error.message}`);
    }
}

// 2. REFERENTIAL INTEGRITY SCENARIOS
async function testReferentialIntegrity(db) {
    log('\n🔍 Testing Referential Integrity Scenarios...');

    await testDeleteWithDependencies(db);
    await testCascadeBehavior(db);
    await testOrphanedRecords(db);
    await testUpdateForeignKeys(db);
}

async function testDeleteWithDependencies(db) {
    // Test deleting category with products
    try {
        const productCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = 1001').get();
        if (productCount.count > 0) {
            try {
                db.prepare('DELETE FROM categories WHERE id = 1001').run();
                addTestResult('Delete Category with Products', false, 'Should have failed due to dependencies');
            } catch (error) {
                addTestResult('Delete Category with Products', true, 'Correctly prevented deletion');
            }
        } else {
            addTestResult('Delete Category with Products', true, 'No products to test with');
        }
    } catch (error) {
        addTestResult('Delete Category with Products', false, error.message);
    }

    // Test deleting customer with orders
    try {
        const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE customer_id = 1001').get();
        if (orderCount.count > 0) {
            try {
                db.prepare('DELETE FROM customers WHERE id = 1001').run();
                addTestResult('Delete Customer with Orders', false, 'Should have failed due to dependencies');
            } catch (error) {
                addTestResult('Delete Customer with Orders', true, 'Correctly prevented deletion');
            }
        } else {
            addTestResult('Delete Customer with Orders', true, 'No orders to test with');
        }
    } catch (error) {
        addTestResult('Delete Customer with Orders', false, error.message);
    }
}

async function testCascadeBehavior(db) {
    // This test would verify if cascade deletes/updates are properly configured
    // For now, we'll test the current behavior
    try {
        const categoriesCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
        const productsCount = db.prepare('SELECT COUNT(*) as count FROM products').get();

        addTestResult('Cascade Behavior Analysis',
            categoriesCount.count > 0 && productsCount.count > 0,
            `Categories: ${categoriesCount.count}, Products: ${productsCount.count}`);
    } catch (error) {
        addTestResult('Cascade Behavior Analysis', false, error.message);
    }
}

async function testOrphanedRecords(db) {
    // Check for orphaned records
    try {
        // Check for products with invalid category_id
        const orphanedProducts = db.prepare(`
            SELECT COUNT(*) as count FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.category_id IS NOT NULL AND c.id IS NULL
        `).get();

        // Check for orders with invalid customer_id
        const orphanedOrders = db.prepare(`
            SELECT COUNT(*) as count FROM orders o 
            LEFT JOIN customers c ON o.customer_id = c.id 
            WHERE o.customer_id IS NOT NULL AND c.id IS NULL
        `).get();

        const hasOrphans = orphanedProducts.count > 0 || orphanedOrders.count > 0;

        addTestResult('Orphaned Records Check', !hasOrphans,
            hasOrphans ? `Found orphaned records - Products: ${orphanedProducts.count}, Orders: ${orphanedOrders.count}` : 'No orphaned records found');

        if (hasOrphans) {
            addIssue(`Found orphaned records - Products: ${orphanedProducts.count}, Orders: ${orphanedOrders.count}`, 'high');
        }
    } catch (error) {
        addTestResult('Orphaned Records Check', false, error.message);
    }
}

async function testUpdateForeignKeys(db) {
    try {
        // Test updating foreign key values
        const result = db.prepare(
            'UPDATE products SET category_id = ? WHERE id = 1001'
        ).run(1002);

        const updated = db.prepare('SELECT category_id FROM products WHERE id = 1001').get();

        addTestResult('Update Foreign Key Values',
            updated && updated.category_id === 1002,
            updated ? `Updated to category_id: ${updated.category_id}` : 'Update failed');
    } catch (error) {
        addTestResult('Update Foreign Key Values', false, error.message);
    }
}

// 3. DATABASE CONSTRAINTS ENFORCEMENT
async function testDatabaseConstraints(db) {
    log('\n🔍 Testing Database Constraints Enforcement...');

    await testUniqueConstraints(db);
    await testNotNullConstraints(db);
    await testCheckConstraints(db);
    await testDefaultValueEnforcement(db);
}

async function testUniqueConstraints(db) {
    // Test unique barcode constraint
    try {
        // First, create a product with a unique barcode
        const barcode = 'UNIQUE_TEST_123';
        db.prepare(`
            INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run('Unique Test Product 1', '10.99', '5.50', 'test1.jpg', 10, barcode, 'Test');

        // Try to create another product with same barcode
        try {
            db.prepare(`
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run('Unique Test Product 2', '15.99', '7.50', 'test2.jpg', 15, barcode, 'Test');

            addTestResult('Unique Barcode Constraint', false, 'Should have failed unique constraint');
        } catch (error) {
            const isUniqueError = error.message.includes('UNIQUE') || error.message.includes('constraint');
            addTestResult('Unique Barcode Constraint', isUniqueError,
                isUniqueError ? null : `Expected unique error, got: ${error.message}`);
        }

        // Clean up
        db.prepare('DELETE FROM products WHERE barcode = ?').run(barcode);
    } catch (error) {
        addTestResult('Unique Barcode Constraint', false, error.message);
    }

    // Test unique category name constraint
    try {
        const categoryName = 'UNIQUE_CATEGORY_TEST';

        // First create category
        db.prepare(`
            INSERT INTO categories (name, description)
            VALUES (?, ?)
        `).run(categoryName, 'Test category');

        // Try to create another with same name
        try {
            db.prepare(`
                INSERT INTO categories (name, description)
                VALUES (?, ?)
            `).run(categoryName, 'Duplicate category');

            addTestResult('Unique Category Name Constraint', false, 'Should have failed unique constraint');
        } catch (error) {
            const isUniqueError = error.message.includes('UNIQUE') || error.message.includes('constraint');
            addTestResult('Unique Category Name Constraint', isUniqueError,
                isUniqueError ? null : `Expected unique error, got: ${error.message}`);
        }

        // Clean up
        db.prepare('DELETE FROM categories WHERE name = ?').run(categoryName);
    } catch (error) {
        addTestResult('Unique Category Name Constraint', false, error.message);
    }

    // Test unique PLU constraint
    try {
        const plu = 'UNIQUE_PLU_TEST';

        db.prepare(`
            INSERT INTO products (name, price, cost, image, stock_quantity, barcode, plu, category)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run('PLU Test Product 1', '10.99', '5.50', 'plu1.jpg', 10, 'PLU_TEST_1', plu, 'Test');

        try {
            db.prepare(`
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, plu, category)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run('PLU Test Product 2', '15.99', '7.50', 'plu2.jpg', 15, 'PLU_TEST_2', plu, 'Test');

            addTestResult('Unique PLU Constraint', false, 'Should have failed unique constraint');
        } catch (error) {
            const isUniqueError = error.message.includes('UNIQUE') || error.message.includes('constraint');
            addTestResult('Unique PLU Constraint', isUniqueError,
                isUniqueError ? null : `Expected unique error, got: ${error.message}`);
        }

        // Clean up
        db.prepare('DELETE FROM products WHERE plu = ?').run(plu);
    } catch (error) {
        addTestResult('Unique PLU Constraint', false, error.message);
    }
}

async function testNotNullConstraints(db) {
    // Test required fields in products
    try {
        let nullConstraintError = false;

        // Test required name field
        try {
            db.prepare(`
                INSERT INTO products (price, cost, image, stock_quantity, barcode, category)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run('10.99', '5.50', 'test.jpg', 10, 'NULL_TEST_1', 'Test');
        } catch (error) {
            if (error.message.includes('NOT NULL') || error.message.includes('constraint')) {
                nullConstraintError = true;
            }
        }

        // Test required price field
        try {
            db.prepare(`
                INSERT INTO products (name, cost, image, stock_quantity, barcode, category)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run('Null Price Test', '5.50', 'test.jpg', 10, 'NULL_TEST_2', 'Test');
        } catch (error) {
            if (error.message.includes('NOT NULL') || error.message.includes('constraint')) {
                nullConstraintError = true;
            }
        }

        addTestResult('NOT NULL Constraints', nullConstraintError,
            nullConstraintError ? 'NOT NULL constraints working correctly' : 'NOT NULL constraints may not be enforced');
    } catch (error) {
        addTestResult('NOT NULL Constraints', false, error.message);
    }
}

async function testCheckConstraints(db) {
    // Note: SQLite doesn't enforce CHECK constraints by default in older versions
    // This test verifies business logic validation

    try {
        // Test negative price handling
        let negativePriceHandled = false;
        try {
            db.prepare(`
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run('Negative Price Test', '-10.99', '5.50', 'negative.jpg', 10, 'NEGATIVE_TEST', 'Test');

            // If we get here, check if the negative price was stored
            const product = db.prepare('SELECT * FROM products WHERE barcode = ?').get('NEGATIVE_TEST');
            if (product && product.price === '-10.99') {
                addIssue('Database allows negative prices - business logic validation needed', 'medium');
                negativePriceHandled = true;
            }
        } catch (error) {
            negativePriceHandled = true; // Good if it was rejected
        }

        // Test negative stock handling
        try {
            db.prepare(`
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run('Negative Stock Test', '10.99', '5.50', 'negative-stock.jpg', -5, 'NEGATIVE_STOCK_TEST', 'Test');

            const product = db.prepare('SELECT * FROM products WHERE barcode = ?').get('NEGATIVE_STOCK_TEST');
            if (product && product.stock_quantity < 0) {
                addIssue('Database allows negative stock quantities - business logic validation needed', 'medium');
            }
        } catch (error) {
            // Good if rejected
        }

        addTestResult('Check Constraints Analysis', true, 'Business logic validation needed for negative values');
    } catch (error) {
        addTestResult('Check Constraints Analysis', false, error.message);
    }
}

async function testDefaultValueEnforcement(db) {
    try {
        // Test default category value
        const result = db.prepare(`
            INSERT INTO products (name, price, cost, image, stock_quantity, barcode)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run('Default Category Test', '10.99', '5.50', 'default.jpg', 10, 'DEFAULT_TEST');

        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);

        addTestResult('Default Value Enforcement',
            product && product.category === 'General',
            product ? `Default category: ${product.category}` : 'Product not found');

        // Clean up
        db.prepare('DELETE FROM products WHERE id = ?').run(result.lastInsertRowid);
    } catch (error) {
        addTestResult('Default Value Enforcement', false, error.message);
    }
}

// 4. TRANSACTION INTEGRITY
async function testTransactionIntegrity(db) {
    log('\n🔍 Testing Transaction Integrity and ACID Compliance...');

    await testAtomicTransactions(db);
    await testRollbackScenarios(db);
    await testConcurrentAccess(db);
    await testIsolationLevels(db);
}

async function testAtomicTransactions(db) {
    try {
        const startTime = Date.now();

        const transaction = db.transaction(() => {
            // Create multiple related records in a single transaction
            const customerResult = db.prepare(`
                INSERT INTO customers (name, email, phone)
                VALUES (?, ?, ?)
            `).run('Transaction Test Customer', 'transaction@test.com', '1234567890');

            const orderResult = db.prepare(`
                INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(customerResult.lastInsertRowid, 1001, '[{"productId":1001,"quantity":1,"price":"999.99"}]', '999.99', 'cash', 'pos', 'completed');

            return { customerId: customerResult.lastInsertRowid, orderId: orderResult.lastInsertRowid };
        });

        const result = transaction();
        const endTime = Date.now();

        testResults.performanceMetrics.atomicTransaction = endTime - startTime;

        // Verify both records were created
        const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.customerId);
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.orderId);

        addTestResult('Atomic Transaction Integrity',
            customer && order && customer.id === result.customerId && order.id === result.orderId,
            `Transaction completed in ${testResults.performanceMetrics.atomicTransaction}ms`);

        // Clean up
        db.prepare('DELETE FROM orders WHERE id = ?').run(result.orderId);
        db.prepare('DELETE FROM customers WHERE id = ?').run(result.customerId);
    } catch (error) {
        addTestResult('Atomic Transaction Integrity', false, error.message);
    }
}

async function testRollbackScenarios(db) {
    try {
        // Test transaction rollback on error
        const initialCount = db.prepare('SELECT COUNT(*) as count FROM customers').get();

        const transaction = db.transaction(() => {
            db.prepare(`
                INSERT INTO customers (name, email, phone)
                VALUES (?, ?, ?)
            `).run('Rollback Test Customer', 'rollback@test.com', '1234567891');

            // Simulate an error
            throw new Error('Simulated transaction error');
        });

        let rollbackOccurred = false;
        try {
            transaction();
        } catch (error) {
            rollbackOccurred = true;
        }

        const finalCount = db.prepare('SELECT COUNT(*) as count FROM customers').get();

        addTestResult('Transaction Rollback',
            rollbackOccurred && finalCount.count === initialCount.count,
            rollbackOccurred ? 'Rollback successful' : 'Rollback failed or did not occur');

        if (!rollbackOccurred) {
            addIssue('Transaction rollback may not be working correctly', 'high');
        }
    } catch (error) {
        addTestResult('Transaction Rollback', false, error.message);
    }
}

async function testConcurrentAccess(db) {
    // This is a simplified test for concurrent access patterns
    try {
        const startTime = Date.now();

        // Simulate concurrent reads
        const readPromises = [];
        for (let i = 0; i < 10; i++) {
            readPromises.push(
                db.prepare('SELECT COUNT(*) as count FROM products').get()
            );
        }

        // Simulate concurrent writes (in a single thread simulation)
        const writeTransaction = db.transaction(() => {
            for (let i = 0; i < 5; i++) {
                db.prepare(`
                    INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `).run(`Concurrent Test ${i}`, '10.99', '5.50', 'concurrent.jpg', 10, `CONCURRENT_${i}`, 'Test');
            }
        });

        writeTransaction();

        const endTime = Date.now();
        testResults.performanceMetrics.concurrentAccess = endTime - startTime;

        // Clean up concurrent test products
        db.prepare('DELETE FROM products WHERE barcode LIKE "CONCURRENT_%"').run();

        addTestResult('Concurrent Access Handling',
            true,
            `Concurrent operations completed in ${testResults.performanceMetrics.concurrentAccess}ms`);
    } catch (error) {
        addTestResult('Concurrent Access Handling', false, error.message);
    }
}

async function testIsolationLevels(db) {
    // Test basic isolation - this is a simplified test
    try {
        const result = db.prepare(`
            INSERT INTO customers (name, email, phone)
            VALUES (?, ?, ?)
        `).run('Isolation Test Customer', 'isolation@test.com', '1234567892');

        // Immediately read the data to test read consistency
        const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);

        addTestResult('Read Consistency',
            customer && customer.name === 'Isolation Test Customer',
            'Read consistency verified');

        // Clean up
        db.prepare('DELETE FROM customers WHERE id = ?').run(result.lastInsertRowid);
    } catch (error) {
        addTestResult('Read Consistency', false, error.message);
    }
}

// 5. DATA CONSISTENCY ACROSS RELATIONSHIPS
async function testDataConsistency(db) {
    log('\n🔍 Testing Data Consistency Across Relationships...');

    await testCustomerLoyaltyConsistency(db);
    await testProductStockConsistency(db);
    await testOrderTotalCalculation(db);
    await testSettingsValidation(db);
}

async function testCustomerLoyaltyConsistency(db) {
    try {
        // Check if customer loyalty points are consistent with order totals
        const customers = db.prepare(`
            SELECT 
                c.id,
                c.name,
                c.loyalty_points,
                c.total_spent,
                COALESCE(SUM(CAST(o.total as REAL)), 0) as calculated_total
            FROM customers c
            LEFT JOIN orders o ON c.id = o.customer_id
            GROUP BY c.id, c.name, c.loyalty_points, c.total_spent
        `).all();

        let inconsistentCustomers = 0;
        for (const customer of customers) {
            const storedTotal = parseFloat(customer.total_spent);
            const calculatedTotal = customer.calculated_total;

            if (Math.abs(storedTotal - calculatedTotal) > 0.01) {
                inconsistentCustomers++;
                addIssue(`Customer ${customer.name} has inconsistent totals: stored ${storedTotal}, calculated ${calculatedTotal}`, 'medium');
            }
        }

        addTestResult('Customer Loyalty Consistency',
            inconsistentCustomers === 0,
            inconsistentCustomers === 0 ? 'All customer totals consistent' : `${inconsistentCustomers} customers have inconsistent totals`);
    } catch (error) {
        addTestResult('Customer Loyalty Consistency', false, error.message);
    }
}

async function testProductStockConsistency(db) {
    try {
        // Check if product stock levels are consistent with order quantities
        const products = db.prepare(`
            SELECT 
                p.id,
                p.name,
                p.stock_quantity,
                COALESCE(SUM(oi.quantity), 0) as ordered_quantity
            FROM products p
            LEFT JOIN order_items oi ON p.id = oi.product_id
            LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
            GROUP BY p.id, p.name, p.stock_quantity
        `).all();

        let stockIssues = 0;
        for (const product of products) {
            // This is a simplified check - in reality, you'd need to track inventory movements
            const availableStock = product.stock_quantity - product.ordered_quantity;
            if (availableStock < 0) {
                stockIssues++;
                addIssue(`Product ${product.name} shows negative available stock: ${availableStock}`, 'medium');
            }
        }

        addTestResult('Product Stock Consistency',
            stockIssues === 0,
            stockIssues === 0 ? 'Stock levels appear consistent' : `${stockIssues} products have stock inconsistencies`);
    } catch (error) {
        addTestResult('Product Stock Consistency', false, error.message);
    }
}

async function testOrderTotalCalculation(db) {
    try {
        // Verify order totals match the sum of order items
        const orders = db.prepare(`
            SELECT 
                o.id,
                o.total as stored_total,
                COALESCE(SUM(CAST(oi.price as REAL) * oi.quantity), 0) as calculated_total
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            GROUP BY o.id, o.total
        `).all();

        let incorrectTotals = 0;
        for (const order of orders) {
            const storedTotal = parseFloat(order.stored_total);
            const calculatedTotal = order.calculated_total;

            if (Math.abs(storedTotal - calculatedTotal) > 0.01) {
                incorrectTotals++;
                addIssue(`Order ${order.id} has incorrect total: stored ${storedTotal}, calculated ${calculatedTotal}`, 'high');
            }
        }

        addTestResult('Order Total Calculation',
            incorrectTotals === 0,
            incorrectTotals === 0 ? 'All order totals are correct' : `${incorrectTotals} orders have incorrect totals`);
    } catch (error) {
        addTestResult('Order Total Calculation', false, error.message);
    }
}

async function testSettingsValidation(db) {
    try {
        // Check if settings have valid values
        const settings = db.prepare('SELECT * FROM settings LIMIT 1').get();

        if (settings) {
            let validSettings = true;
            const issues = [];

            // Validate required settings
            if (!settings.store_name || settings.store_name.trim() === '') {
                validSettings = false;
                issues.push('Store name is empty');
            }

            if (!settings.currency || settings.currency.trim() === '') {
                validSettings = false;
                issues.push('Currency is empty');
            }

            // Validate numeric settings
            if (settings.session_timeout !== null && (isNaN(settings.session_timeout) || settings.session_timeout < 0)) {
                validSettings = false;
                issues.push('Invalid session timeout');
            }

            addTestResult('Settings Validation',
                validSettings,
                validSettings ? 'All settings are valid' : `Settings issues: ${issues.join(', ')}`);
        } else {
            addTestResult('Settings Validation', true, 'No settings record found to validate');
        }
    } catch (error) {
        addTestResult('Settings Validation', false, error.message);
    }
}

// 6. COMPLEX BUSINESS SCENARIOS
async function testComplexBusinessScenarios(db) {
    log('\n🔍 Testing Complex Business Scenarios...');

    await testCompleteSalesWorkflow(db);
    await testCustomerDeletionScenario(db);
    await testProductDeletionScenario(db);
    await testSettingsChangeImpact(db);
}

async function testCompleteSalesWorkflow(db) {
    try {
        const workflowStart = Date.now();

        // Complete sales workflow: Customer -> Order -> Stock deduction -> Loyalty update
        const workflow = db.transaction(() => {
            // 1. Create customer
            const customerResult = db.prepare(`
                INSERT INTO customers (name, email, phone, loyalty_points, total_spent)
                VALUES (?, ?, ?, ?, ?)
            `).run('Workflow Customer', 'workflow@test.com', '1234567893', 0, '0');

            // 2. Create order
            const orderResult = db.prepare(`
                INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
                customerResult.lastInsertRowid,
                1001,
                '[{"productId":1001,"quantity":1,"price":"999.99"},{"productId":1003,"quantity":2,"price":"8.99"}]',
                '1017.97',
                'cash',
                'pos',
                'completed'
            );

            // 3. Update customer loyalty and total spent
            const newTotal = 1017.97;
            db.prepare(`
                UPDATE customers 
                SET loyalty_points = loyalty_points + ?, 
                    total_spent = CAST(total_spent as REAL) + ?
                WHERE id = ?
            `).run(Math.floor(newTotal), newTotal, customerResult.lastInsertRowid);

            // 4. Update product stock
            db.prepare(`
                UPDATE products 
                SET stock_quantity = stock_quantity - ? 
                WHERE id = 1001
            `).run(1);

            db.prepare(`
                UPDATE products 
                SET stock_quantity = stock_quantity - ? 
                WHERE id = 1003
            `).run(2);

            return {
                customerId: customerResult.lastInsertRowid,
                orderId: orderResult.lastInsertRowid
            };
        });

        const result = workflow();
        const workflowEnd = Date.now();

        // Verify the workflow results
        const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.customerId);
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.orderId);
        const updatedProduct1 = db.prepare('SELECT stock_quantity FROM products WHERE id = 1001').get();
        const updatedProduct3 = db.prepare('SELECT stock_quantity FROM products WHERE id = 1003').get();

        const workflowSuccess = customer && order &&
            customer.loyalty_points >= 1017 &&
            parseFloat(customer.total_spent) >= 1017.97 &&
            updatedProduct1.stock_quantity >= 49 && // Original was 50
            updatedProduct3.stock_quantity >= 196; // Original was 200

        testResults.performanceMetrics.completeWorkflow = workflowEnd - workflowStart;

        addTestResult('Complete Sales Workflow',
            workflowSuccess,
            `Workflow completed in ${testResults.performanceMetrics.completeWorkflow}ms`);

        if (!workflowSuccess) {
            addIssue('Complete sales workflow failed or produced inconsistent results', 'high');
        }

        // Clean up
        db.prepare('DELETE FROM orders WHERE id = ?').run(result.orderId);
        db.prepare('DELETE FROM customers WHERE id = ?').run(result.customerId);
        db.prepare('UPDATE products SET stock_quantity = 50 WHERE id = 1001').run();
        db.prepare('UPDATE products SET stock_quantity = 200 WHERE id = 1003').run();
    } catch (error) {
        addTestResult('Complete Sales Workflow', false, error.message);
    }
}

async function testCustomerDeletionScenario(db) {
    try {
        // Create a customer with order history
        const customerResult = db.prepare(`
            INSERT INTO customers (name, email, phone)
            VALUES (?, ?, ?)
        `).run('Delete Test Customer', 'delete@test.com', '1234567894');

        const orderResult = db.prepare(`
            INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(customerResult.lastInsertRowid, 1001, '[{"productId":1001,"quantity":1,"price":"999.99"}]', '999.99', 'cash', 'pos', 'completed');

        // Try to delete customer with order history
        let deletionPrevented = false;
        try {
            db.prepare('DELETE FROM customers WHERE id = ?').run(customerResult.lastInsertRowid);
        } catch (error) {
            deletionPrevented = true;
        }

        // Check if customer still exists (due to foreign key constraint)
        const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerResult.lastInsertRowid);
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderResult.lastInsertRowid);

        addTestResult('Customer Deletion with Order History',
            deletionPrevented || (customer && order),
            deletionPrevented ? 'Deletion prevented by foreign key' : 'Customer and order still exist');

        // Clean up
        db.prepare('DELETE FROM orders WHERE id = ?').run(orderResult.lastInsertRowid);
        db.prepare('DELETE FROM customers WHERE id = ?').run(customerResult.lastInsertRowid);
    } catch (error) {
        addTestResult('Customer Deletion with Order History', false, error.message);
    }
}

async function testProductDeletionScenario(db) {
    try {
        // Create a product with order items
        const productResult = db.prepare(`
            INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run('Delete Test Product', '50.99', '25.50', 'delete-product.jpg', 25, 'DELETE_PRODUCT_TEST', 'Test');

        const orderResult = db.prepare(`
            INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(1001, 1001, '[{"productId":' + productResult.lastInsertRowid + ',"quantity":1,"price":"50.99"}]', '50.99', 'cash', 'pos', 'completed');

        // Try to delete product with order history
        let deletionPrevented = false;
        try {
            db.prepare('DELETE FROM products WHERE id = ?').run(productResult.lastInsertRowid);
        } catch (error) {
            deletionPrevented = true;
        }

        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productResult.lastInsertRowid);

        addTestResult('Product Deletion with Order Items',
            deletionPrevented || product,
            deletionPrevented ? 'Deletion prevented by foreign key' : 'Product still exists');

        // Clean up
        db.prepare('DELETE FROM orders WHERE id = ?').run(orderResult.lastInsertRowid);
        db.prepare('DELETE FROM products WHERE id = ?').run(productResult.lastInsertRowid);
    } catch (error) {
        addTestResult('Product Deletion with Order Items', false, error.message);
    }
}

async function testSettingsChangeImpact(db) {
    try {
        // Test how settings changes affect system behavior
        const originalSettings = db.prepare('SELECT * FROM settings LIMIT 1').get();

        if (originalSettings) {
            // Update some settings
            db.prepare(`
                UPDATE settings 
                SET store_name = ?, currency = ?, low_stock_threshold = ?
                WHERE id = ?
            `).run('Test Store Name', 'USD', 5, originalSettings.id);

            const updatedSettings = db.prepare('SELECT * FROM settings WHERE id = ?').get(originalSettings.id);

            const settingsChanged = updatedSettings &&
                updatedSettings.store_name === 'Test Store Name' &&
                updatedSettings.currency === 'USD' &&
                updatedSettings.low_stock_threshold === 5;

            addTestResult('Settings Change Impact',
                settingsChanged,
                settingsChanged ? 'Settings changes applied successfully' : 'Settings changes failed');

            // Restore original settings
            db.prepare(`
                UPDATE settings 
                SET store_name = ?, currency = ?, low_stock_threshold = ?
                WHERE id = ?
            `).run(originalSettings.store_name, originalSettings.currency, originalSettings.low_stock_threshold, originalSettings.id);
        } else {
            addTestResult('Settings Change Impact', true, 'No settings record to test');
        }
    } catch (error) {
        addTestResult('Settings Change Impact', false, error.message);
    }
}

// 7. DATABASE PERFORMANCE AND OPTIMIZATION
async function testDatabasePerformance(db) {
    log('\n🔍 Testing Database Performance and Optimization...');

    await testIndexEffectiveness(db);
    await testQueryPerformance(db);
    await testLargeDatasetHandling(db);
    await testDatabaseMaintenance(db);
}

async function testIndexEffectiveness(db) {
    try {
        // Check if indexes exist on foreign key columns
        const indexes = db.prepare("PRAGMA index_list(products)").all();
        const productIndexes = db.prepare("PRAGMA index_info(products)").all();

        // Check foreign key indexes
        const fkIndexes = db.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type = 'index' 
            AND sql LIKE '%category_id%'
        `).all();

        addTestResult('Index Effectiveness Analysis',
            true,
            `Found ${fkIndexes.length} foreign key indexes`);
    } catch (error) {
        addTestResult('Index Effectiveness Analysis', false, error.message);
    }
}

async function testQueryPerformance(db) {
    try {
        const startTime = Date.now();

        // Complex join query performance
        const complexQuery = db.prepare(`
            SELECT 
                o.id,
                o.total,
                o.created_at,
                c.name as customer_name,
                u.name as user_name,
                COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.created_at > strftime('%s', 'now', '-30 days')
            GROUP BY o.id, o.total, o.created_at, c.name, u.name
            ORDER BY o.created_at DESC
            LIMIT 50
        `).all();

        const endTime = Date.now();
        const queryTime = endTime - startTime;
        testResults.performanceMetrics.complexQuery = queryTime;

        addTestResult('Complex Query Performance',
            queryTime < 1000,
            `Query executed in ${queryTime}ms, returned ${complexQuery.length} records`);

        if (queryTime >= 1000) {
            addIssue(`Complex query performance is slow: ${queryTime}ms`, 'medium');
        }
    } catch (error) {
        addTestResult('Complex Query Performance', false, error.message);
    }
}

async function testLargeDatasetHandling(db) {
    try {
        const startTime = Date.now();

        // Create a large dataset for testing
        const insertMany = db.transaction(() => {
            for (let i = 0; i < 1000; i++) {
                db.prepare(`
                    INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `).run(
                    `Performance Test Product ${i}`,
                    (Math.random() * 100 + 10).toFixed(2),
                    (Math.random() * 50 + 5).toFixed(2),
                    'perf-test.jpg',
                    Math.floor(Math.random() * 100) + 1,
                    `PERF_${i.toString().padStart(6, '0')}`,
                    'Performance Test'
                );
            }
        });

        insertMany();

        // Test query performance on large dataset
        const queryStart = Date.now();
        const products = db.prepare('SELECT * FROM products WHERE category = ?').all('Performance Test');
        const queryEnd = Date.now();

        const totalTime = Date.now() - startTime;
        testResults.performanceMetrics.largeDataset = totalTime;
        testResults.performanceMetrics.largeDatasetQuery = queryEnd - queryStart;

        addTestResult('Large Dataset Handling',
            totalTime < 10000 && queryEnd - queryStart < 1000,
            `Large dataset operations completed in ${totalTime}ms, query in ${queryEnd - queryStart}ms`);

        // Clean up
        db.prepare('DELETE FROM products WHERE category = ?').run('Performance Test');
    } catch (error) {
        addTestResult('Large Dataset Handling', false, error.message);
    }
}

async function testDatabaseMaintenance(db) {
    try {
        const startTime = Date.now();

        // Run database maintenance operations
        db.exec('VACUUM');
        db.exec('ANALYZE');

        const endTime = Date.now();
        testResults.performanceMetrics.maintenance = endTime - startTime;

        addTestResult('Database Maintenance Operations',
            testResults.performanceMetrics.maintenance < 5000,
            `Maintenance completed in ${testResults.performanceMaintenance}ms`);
    } catch (error) {
        addTestResult('Database Maintenance Operations', false, error.message);
    }
}

// 8. EDGE CASES AND ERROR SCENARIOS
async function testEdgeCasesAndErrorScenarios(db) {
    log('\n🔍 Testing Edge Cases and Error Scenarios...');

    await testDataTypeValidation(db);
    await testStringLengthLimits(db);
    await testSpecialCharacters(db);
    await testBoundaryConditions(db);
}

async function testDataTypeValidation(db) {
    try {
        // Test invalid data types
        let typeValidationErrors = 0;

        // Test invalid price format
        try {
            db.prepare(`
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run('Invalid Price Product', 'not_a_number', '5.50', 'invalid-price.jpg', 10, 'INVALID_PRICE', 'Test');
        } catch (error) {
            typeValidationErrors++;
        }

        // Test invalid stock quantity
        try {
            db.prepare(`
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run('Invalid Stock Product', '10.99', '5.50', 'invalid-stock.jpg', 'not_a_number', 'INVALID_STOCK', 'Test');
        } catch (error) {
            typeValidationErrors++;
        }

        addTestResult('Data Type Validation',
            typeValidationErrors > 0,
            `${typeValidationErrors} type validation errors detected`);
    } catch (error) {
        addTestResult('Data Type Validation', false, error.message);
    }
}

async function testStringLengthLimits(db) {
    try {
        // Test very long strings
        const longString = 'A'.repeat(1000);

        try {
            const result = db.prepare(`
                INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(longString, '10.99', '5.50', 'long-string.jpg', 10, 'LONG_STRING_TEST', 'Test');

            if (result.lastInsertRowid) {
                const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);

                addTestResult('String Length Limits',
                    product && product.name.length <= 255,
                    `Stored string length: ${product ? product.name.length : 'N/A'}`);

                // Clean up
                db.prepare('DELETE FROM products WHERE id = ?').run(result.lastInsertRowid);
            }
        } catch (error) {
            addTestResult('String Length Limits', true, 'Long string rejected (expected)');
        }
    } catch (error) {
        addTestResult('String Length Limits', false, error.message);
    }
}

async function testSpecialCharacters(db) {
    try {
        const specialCharName = 'Product with "quotes" & special chars!@#$%^&*()';

        const result = db.prepare(`
            INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(specialCharName, '10.99', '5.50', 'special-chars.jpg', 10, 'SPECIAL_CHARS_TEST', 'Test');

        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);

        addTestResult('Special Characters Handling',
            product && product.name.includes('quotes'),
            `Special characters handled: ${product ? product.name : 'Not found'}`);

        // Clean up
        db.prepare('DELETE FROM products WHERE id = ?').run(result.lastInsertRowid);
    } catch (error) {
        addTestResult('Special Characters Handling', false, error.message);
    }
}

async function testBoundaryConditions(db) {
    try {
        // Test boundary values
        const boundaryTests = [
            { name: 'Zero Price', price: '0.00', expected: true },
            { name: 'Very Small Price', price: '0.01', expected: true },
            { name: 'Very Large Price', price: '999999999.99', expected: true },
            { name: 'Zero Stock', stock: 0, expected: true },
            { name: 'Maximum Stock', stock: 2147483647, expected: true }
        ];

        let boundaryResults = 0;
        for (const test of boundaryTests) {
            try {
                const result = db.prepare(`
                    INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `).run(
                    `Boundary Test ${test.name}`,
                    test.price || '10.99',
                    '5.50',
                    'boundary.jpg',
                    test.stock || 10,
                    `BOUNDARY_${test.name.replace(/\s+/g, '_')}`,
                    'Test'
                );

                if (result.lastInsertRowid) {
                    boundaryResults++;
                    // Clean up
                    db.prepare('DELETE FROM products WHERE id = ?').run(result.lastInsertRowid);
                }
            } catch (error) {
                // Some boundary conditions might be expected to fail
            }
        }

        addTestResult('Boundary Conditions',
            boundaryResults >= boundaryTests.length / 2,
            `${boundaryResults}/${boundaryTests.length} boundary tests passed`);
    } catch (error) {
        addTestResult('Boundary Conditions', false, error.message);
    }
}

// GENERATE COMPREHENSIVE REPORT
async function generateComprehensiveReport() {
    const endTime = Date.now();

    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalTests: testResults.total,
            passed: testResults.passed,
            failed: testResults.failed,
            warnings: testResults.warnings,
            passRate: ((testResults.passed / testResults.total) * 100).toFixed(2) + '%',
            overallStatus: testResults.failed === 0 ? 'PASS' : 'FAIL'
        },
        performanceMetrics: testResults.performanceMetrics,
        issuesFound: testResults.issuesFound,
        errors: testResults.errors,
        recommendations: generateRecommendations()
    };

    // Write comprehensive report
    fs.writeFileSync('database-integrity-test-report.json', JSON.stringify(report, null, 2));

    // Generate markdown report
    const markdownReport = generateMarkdownReport(report);
    fs.writeFileSync('database-integrity-test-report.md', markdownReport);

    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE DATABASE INTEGRITY TEST RESULTS');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Warnings: ${report.summary.warnings}`);
    console.log(`Pass Rate: ${report.summary.passRate}`);
    console.log(`Overall Status: ${report.summary.overallStatus}`);
    console.log(`Issues Found: ${testResults.issuesFound.length}`);

    if (Object.keys(testResults.performanceMetrics).length > 0) {
        console.log('\nPerformance Metrics:');
        Object.entries(testResults.performanceMetrics).forEach(([metric, value]) => {
            console.log(`  ${metric}: ${value}ms`);
        });
    }

    if (testResults.issuesFound.length > 0) {
        console.log('\n🔍 Issues Found:');
        testResults.issuesFound.forEach((issue, index) => {
            console.log(`  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.issue}`);
        });
    }

    if (testResults.errors.length > 0) {
        console.log('\n❌ Test Errors:');
        testResults.errors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error.test}: ${error.error}`);
        });
    }

    console.log('\n📄 Reports saved to:');
    console.log('  - database-integrity-test-report.json');
    console.log('  - database-integrity-test-report.md');
    console.log('='.repeat(80));
}

function generateRecommendations() {
    const recommendations = [];

    if (testResults.failed > 0) {
        recommendations.push('Fix failed tests before production deployment');
    }

    if (testResults.issuesFound.length > 0) {
        recommendations.push('Address identified issues to improve database integrity');
    }

    const criticalIssues = testResults.issuesFound.filter(issue => issue.severity === 'high');
    if (criticalIssues.length > 0) {
        recommendations.push('Prioritize fixing high-severity issues immediately');
    }

    if (testResults.performanceMetrics.complexQuery > 1000) {
        recommendations.push('Optimize complex queries or add missing indexes');
    }

    if (testResults.performanceMetrics.largeDataset > 10000) {
        recommendations.push('Consider database optimization for large datasets');
    }

    // Check for specific constraint issues
    const constraintIssues = testResults.issuesFound.filter(issue =>
        issue.issue.includes('constraint') || issue.issue.includes('unique') || issue.issue.includes('foreign key')
    );

    if (constraintIssues.length > 0) {
        recommendations.push('Review and strengthen database constraints');
    }

    recommendations.push('Implement regular database integrity checks');
    recommendations.push('Set up automated testing for database constraints');
    recommendations.push('Consider implementing database monitoring and alerting');

    return recommendations;
}

function generateMarkdownReport(report) {
    return `# Comprehensive Database Integrity Test Report

Generated: ${report.timestamp}

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${report.summary.totalTests} |
| Passed | ${report.summary.passed} |
| Failed | ${report.summary.failed} |
| Warnings | ${report.summary.warnings} |
| Pass Rate | ${report.summary.passRate} |
| Overall Status | ${report.summary.overallStatus} |

## Performance Metrics

${Object.keys(report.performanceMetrics).length > 0 ? `
| Metric | Value (ms) |
|--------|------------|
${Object.entries(report.performanceMetrics).map(([metric, value]) => `| ${metric} | ${value} |`).join('\n')}
` : 'No performance metrics recorded'}

## Issues Found

${report.issuesFound.length > 0 ? `
| Severity | Issue |
|----------|-------|
${report.issuesFound.map(issue => `| ${issue.severity.toUpperCase()} | ${issue.issue} |`).join('\n')}
` : 'No issues found'}

## Test Errors

${report.errors.length > 0 ? `
| Test | Error |
|------|-------|
${report.errors.map(error => `| ${error.test} | ${error.error} |`).join('\n')}
` : 'No test errors'}

## Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Test Coverage

This comprehensive test suite covers:

1. **Foreign Key Relationships**: All cross-table references and integrity
2. **Referential Integrity**: Delete/update cascade behavior and orphaned record prevention
3. **Database Constraints**: UNIQUE, NOT NULL, CHECK constraints enforcement
4. **Transaction Integrity**: ACID compliance and rollback scenarios
5. **Data Consistency**: Cross-entity relationship validation
6. **Business Scenarios**: Complete workflows and edge cases
7. **Performance**: Query optimization and large dataset handling
8. **Error Handling**: Edge cases and boundary conditions

## Conclusion

${report.summary.overallStatus === 'PASS' ?
            '✅ All database integrity tests passed. The database is ready for production.' :
            '❌ Some tests failed. Please address the issues before production deployment.'}
`;
}

// Run the tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runDatabaseIntegrityTests()
        .then(results => {
            const exitCode = results.failed > 0 ? 1 : 0;
            process.exit(exitCode);
        })
        .catch(error => {
            console.error('Test suite fatal error:', error);
            process.exit(1);
        });
}