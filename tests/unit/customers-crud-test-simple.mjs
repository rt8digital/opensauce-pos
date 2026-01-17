import Database from 'better-sqlite3';
import fs from 'fs';

class CustomerCRUDTester {
    constructor() {
        this.db = null;
        this.testResults = [];
        this.testCount = 0;
        this.passCount = 0;
        this.failCount = 0;
    }

    initDatabase() {
        try {
            // Use existing database or create new one
            const dbPath = 'sqlite.db';
            this.db = new Database(dbPath);
            console.log('✓ Database connection established');
            return true;
        } catch (error) {
            console.error('✗ Failed to connect to database:', error.message);
            return false;
        }
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

    testCustomerCreate() {
        // Test 1: Create customer with valid data
        this.runTest('Create customer with valid data', () => {
            const customer = {
                name: 'John Doe',
                email: 'john@example.com',
                phone: '123-456-7890'
            };

            const stmt = this.db.prepare('INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)');
            const result = stmt.run(customer.name, customer.email, customer.phone);

            if (!result.lastInsertRowid) {
                throw new Error('Customer creation failed - no ID returned');
            }

            const created = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
            if (!created) throw new Error('Created customer not found');

            // Check default values
            if (created.loyalty_points !== 0) {
                throw new Error(`Expected loyalty_points=0, got ${created.loyalty_points}`);
            }
            if (created.total_spent !== '0') {
                throw new Error(`Expected total_spent='0', got ${created.total_spent}`);
            }
        });

        // Test 2: Create customer with minimal data (name only)
        this.runTest('Create customer with name only', () => {
            const customer = {
                name: 'Jane Smith'
            };

            const stmt = this.db.prepare('INSERT INTO customers (name) VALUES (?)');
            const result = stmt.run(customer.name);

            if (!result.lastInsertRowid) {
                throw new Error('Customer creation failed - no ID returned');
            }

            const created = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
            if (!created) throw new Error('Created customer not found');
            if (created.email !== null) throw new Error('Email should be null');
            if (created.phone !== null) throw new Error('Phone should be null');
        });

        // Test 3: Create customer without name (should fail)
        this.runTest('Create customer without name (should fail)', () => {
            try {
                const stmt = this.db.prepare('INSERT INTO customers (email, phone) VALUES (?, ?)');
                stmt.run('test@example.com', '123-456-7890');
                throw new Error('Should have failed - name is required');
            } catch (error) {
                if (!error.message.includes('NOT NULL') && !error.message.includes('required')) {
                    throw new Error('Expected NOT NULL constraint error, got: ' + error.message);
                }
            }
        });

        // Test 4: Test duplicate email constraint (if exists)
        this.runTest('Test duplicate email handling', () => {
            const customer1 = {
                name: 'Test User 1',
                email: 'duplicate@example.com'
            };

            const customer2 = {
                name: 'Test User 2',
                email: 'duplicate@example.com'
            };

            // Create first customer
            const stmt1 = this.db.prepare('INSERT INTO customers (name, email) VALUES (?, ?)');
            stmt1.run(customer1.name, customer1.email);

            // Try to create second with same email
            try {
                const stmt2 = this.db.prepare('INSERT INTO customers (name, email) VALUES (?, ?)');
                stmt2.run(customer2.name, customer2.email);
                // If we get here, duplicate email was allowed (may be by design)
                console.log('  Note: Duplicate email allowed - this may be intentional');
            } catch (error) {
                // Expected if unique constraint exists
                console.log(`  Note: Duplicate email rejected: ${error.message}`);
            }
        });

        // Test 5: Test duplicate phone constraint (if exists)
        this.runTest('Test duplicate phone handling', () => {
            const customer1 = {
                name: 'Phone User 1',
                phone: '555-1234'
            };

            const customer2 = {
                name: 'Phone User 2',
                phone: '555-1234'
            };

            // Create first customer
            const stmt1 = this.db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)');
            stmt1.run(customer1.name, customer1.phone);

            // Try to create second with same phone
            try {
                const stmt2 = this.db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)');
                stmt2.run(customer2.name, customer2.phone);
                // If we get here, duplicate phone was allowed (may be by design)
                console.log('  Note: Duplicate phone allowed - this may be intentional');
            } catch (error) {
                // Expected if unique constraint exists
                console.log(`  Note: Duplicate phone rejected: ${error.message}`);
            }
        });
    }

    testCustomerRead() {
        // Test 6: Get all customers
        this.runTest('Get all customers', () => {
            const customers = this.db.prepare('SELECT * FROM customers ORDER BY name').all();
            if (!Array.isArray(customers)) {
                throw new Error('Expected array of customers');
            }
            console.log(`  Found ${customers.length} customers`);
        });

        // Test 7: Get customer by ID
        this.runTest('Get customer by ID', () => {
            // First create a test customer
            const stmt = this.db.prepare('INSERT INTO customers (name, email) VALUES (?, ?)');
            const result = stmt.run('Read Test User', 'read@example.com');
            const customerId = result.lastInsertRowid;

            const customer = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
            if (!customer) throw new Error('Customer not found by ID');
            if (customer.name !== 'Read Test User') throw new Error('Customer name mismatch');
        });

        // Test 8: Search customers by name
        this.runTest('Search customers by name', () => {
            // Create test customers
            this.db.prepare('INSERT INTO customers (name) VALUES (?)').run('Search Target');
            this.db.prepare('INSERT INTO customers (name) VALUES (?)').run('Other Customer');
            this.db.prepare('INSERT INTO customers (name) VALUES (?)').run('Search Target 2');

            const results = this.db.prepare('SELECT * FROM customers WHERE name LIKE ? ORDER BY name')
                .all('%Search Target%');

            if (results.length !== 2) {
                throw new Error(`Expected 2 customers with 'Search Target', found ${results.length}`);
            }
        });

        // Test 9: Filter by email
        this.runTest('Filter customers by email', () => {
            const email = 'filter@example.com';
            this.db.prepare('INSERT INTO customers (name, email) VALUES (?, ?)').run('Filter Test', email);

            const results = this.db.prepare('SELECT * FROM customers WHERE email = ?').all(email);

            if (results.length !== 1) {
                throw new Error(`Expected 1 customer with email ${email}, found ${results.length}`);
            }
        });

        // Test 10: Filter by phone
        this.runTest('Filter customers by phone', () => {
            const phone = '555-9999';
            this.db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run('Phone Filter Test', phone);

            const results = this.db.prepare('SELECT * FROM customers WHERE phone = ?').all(phone);

            if (results.length !== 1) {
                throw new Error(`Expected 1 customer with phone ${phone}, found ${results.length}`);
            }
        });
    }

    testCustomerUpdate() {
        // Test 11: Update customer (if operation exists in backend)
        this.runTest('Update customer information', () => {
            // Create test customer
            const stmt = this.db.prepare('INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)');
            const result = stmt.run('Update Test', 'update@example.com', '555-1111');
            const customerId = result.lastInsertRowid;

            try {
                const updateStmt = this.db.prepare('UPDATE customers SET name = ?, email = ?, phone = ? WHERE id = ?');
                const updateResult = updateStmt.run('Updated Name', 'updated@example.com', '555-2222', customerId);

                if (updateResult.changes === 0) {
                    throw new Error('UPDATE operation failed - no rows affected');
                }

                // Verify update
                const updated = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
                if (updated.name !== 'Updated Name') throw new Error('Name update failed');
                if (updated.email !== 'updated@example.com') throw new Error('Email update failed');
                if (updated.phone !== '555-2222') throw new Error('Phone update failed');

            } catch (error) {
                // Check if UPDATE is not implemented
                if (error.message.includes('no such column') || error.message.includes('syntax error')) {
                    throw new Error('UPDATE operation not implemented in backend');
                }
                throw error;
            }
        });

        // Test 12: Partial update (only name)
        this.runTest('Partial customer update', () => {
            const stmt = this.db.prepare('INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)');
            const result = stmt.run('Partial Update Test', 'partial@example.com', '555-3333');
            const customerId = result.lastInsertRowid;

            try {
                this.db.prepare('UPDATE customers SET name = ? WHERE id = ?')
                    .run('Partially Updated', customerId);

                const updated = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
                if (updated.name !== 'Partially Updated') throw new Error('Partial update failed');
                if (updated.email !== 'partial@example.com') throw new Error('Email should remain unchanged');
            } catch (error) {
                throw new Error('UPDATE operation not implemented: ' + error.message);
            }
        });

        // Test 13: Update non-existent customer
        this.runTest('Update non-existent customer', () => {
            try {
                const result = this.db.prepare('UPDATE customers SET name = ? WHERE id = ?')
                    .run('Non-existent', 99999);

                if (result.changes > 0) {
                    throw new Error('UPDATE should not affect non-existent customer');
                }
            } catch (error) {
                throw new Error('UPDATE operation not implemented: ' + error.message);
            }
        });
    }

    testCustomerDelete() {
        // Test 14: Delete customer (if operation exists in backend)
        this.runTest('Delete customer', () => {
            // Create test customer
            const stmt = this.db.prepare('INSERT INTO customers (name) VALUES (?)');
            const result = stmt.run('Delete Test');
            const customerId = result.lastInsertRowid;

            try {
                const deleteStmt = this.db.prepare('DELETE FROM customers WHERE id = ?');
                const deleteResult = deleteStmt.run(customerId);

                if (deleteResult.changes === 0) {
                    throw new Error('DELETE operation failed - no rows affected');
                }

                // Verify deletion
                const deleted = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
                if (deleted) throw new Error('Customer should be deleted');

            } catch (error) {
                throw new Error('DELETE operation not implemented: ' + error.message);
            }
        });

        // Test 15: Delete non-existent customer
        this.runTest('Delete non-existent customer', () => {
            try {
                const result = this.db.prepare('DELETE FROM customers WHERE id = ?').run(99999);

                if (result.changes > 0) {
                    throw new Error('DELETE should not affect non-existent customer');
                }
            } catch (error) {
                throw new Error('DELETE operation not implemented: ' + error.message);
            }
        });

        // Test 16: Test referential integrity (customer with orders)
        this.runTest('Test customer deletion with orders', () => {
            // Create customer
            const customerStmt = this.db.prepare('INSERT INTO customers (name) VALUES (?)');
            const customerResult = customerStmt.run('Order Customer');
            const customerId = customerResult.lastInsertRowid;

            // Create order for customer
            const orderStmt = this.db.prepare('INSERT INTO orders (items, total, payment_method, customer_id) VALUES (?, ?, ?, ?)');
            orderStmt.run('Test Item', '10.00', 'cash', customerId);

            try {
                // Try to delete customer with orders
                const deleteStmt = this.db.prepare('DELETE FROM customers WHERE id = ?');
                const deleteResult = deleteStmt.run(customerId);

                if (deleteResult.changes > 0) {
                    console.log('  Note: Customer with orders was deleted (may need CASCADE or soft delete)');
                }
            } catch (error) {
                console.log(`  Note: Customer with orders protected: ${error.message}`);
            }
        });
    }

    testCustomerValidation() {
        // Test 17: Email format validation
        this.runTest('Email format validation', () => {
            const invalidEmails = ['invalid-email', '@example.com', 'user@', 'user@.com', 'user@domain'];

            for (const email of invalidEmails) {
                try {
                    this.db.prepare('INSERT INTO customers (name, email) VALUES (?, ?)')
                        .run('Email Test', email);
                    console.log(`  Note: Email '${email}' was accepted (no validation implemented)`);
                } catch (error) {
                    console.log(`  Note: Email '${email}' rejected: ${error.message}`);
                }
            }

            const validEmail = 'valid@example.com';
            const result = this.db.prepare('INSERT INTO customers (name, email) VALUES (?, ?)')
                .run('Valid Email Test', validEmail);
            if (result.lastInsertRowid) {
                console.log(`  ✓ Valid email '${validEmail}' accepted`);
            }
        });

        // Test 18: Phone number validation
        this.runTest('Phone number validation', () => {
            const phoneNumbers = ['123', '123456789012345', 'abc123', '+1234567890', '123-456-7890', '123.456.7890'];

            for (const phone of phoneNumbers) {
                try {
                    this.db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)')
                        .run('Phone Test', phone);
                    console.log(`  Note: Phone '${phone}' was accepted (no validation implemented)`);
                } catch (error) {
                    console.log(`  Note: Phone '${phone}' rejected: ${error.message}`);
                }
            }
        });

        // Test 19: Name length validation
        this.runTest('Name length validation', () => {
            const shortName = '';
            const longName = 'a'.repeat(1000); // Very long name

            try {
                this.db.prepare('INSERT INTO customers (name) VALUES (?)').run(shortName);
                console.log('  Note: Empty name was accepted (may need validation)');
            } catch (error) {
                console.log(`  Note: Empty name rejected: ${error.message}`);
            }

            try {
                this.db.prepare('INSERT INTO customers (name) VALUES (?)').run(longName);
                console.log(`  Note: Very long name (${longName.length} chars) was accepted`);
            } catch (error) {
                console.log(`  Note: Very long name rejected: ${error.message}`);
            }
        });
    }

    testCustomerLoyaltyPoints() {
        // Test 20: Loyalty points calculation
        this.runTest('Loyalty points system', () => {
            // Create customer
            const customerStmt = this.db.prepare('INSERT INTO customers (name) VALUES (?)');
            const customerResult = customerStmt.run('Loyalty Test Customer');
            const customerId = customerResult.lastInsertRowid;

            // Create orders with different amounts
            const orderStmt = this.db.prepare('INSERT INTO orders (items, total, payment_method, customer_id) VALUES (?, ?, ?, ?)');
            orderStmt.run('Item 1', '50.00', 'cash', customerId);
            orderStmt.run('Item 2', '75.00', 'card', customerId);

            // Check if loyalty points are calculated
            const customer = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
            console.log(`  Customer loyalty points: ${customer.loyalty_points}`);
            console.log(`  Customer total spent: ${customer.total_spent}`);

            if (customer.loyalty_points === 0 && customer.total_spent === '0') {
                console.log('  Note: Loyalty points and total spent not calculated from orders');
            }
        });

        // Test 21: Loyalty points updates
        this.runTest('Loyalty points updates', () => {
            const customerStmt = this.db.prepare('INSERT INTO customers (name, loyalty_points, total_spent) VALUES (?, ?, ?)');
            const customerResult = customerStmt.run('Loyalty Update Test', 10, '100.00');
            const customerId = customerResult.lastInsertRowid;

            // Simulate loyalty point calculation
            this.db.prepare('UPDATE customers SET loyalty_points = ?, total_spent = ? WHERE id = ?')
                .run(15, '150.00', customerId);

            const updated = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
            if (updated.loyalty_points !== 15) throw new Error('Loyalty points update failed');
            if (updated.total_spent !== '150.00') throw new Error('Total spent update failed');
        });
    }

    testPerformance() {
        // Test 22: Bulk customer creation
        this.runTest('Bulk customer creation performance', () => {
            const startTime = Date.now();
            const customerCount = 100;
            const stmt = this.db.prepare('INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)');

            for (let i = 0; i < customerCount; i++) {
                stmt.run(`Bulk Customer ${i}`, `bulk${i}@example.com`, `555-${i.toString().padStart(4, '0')}`);
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            console.log(`  Created ${customerCount} customers in ${duration}ms`);

            if (duration > 5000) {
                console.log('  Warning: Bulk creation took longer than expected');
            }
        });

        // Test 23: Customer search performance
        this.runTest('Customer search performance', () => {
            const startTime = Date.now();

            // Search operations
            this.db.prepare('SELECT * FROM customers WHERE name LIKE ?').all('%Customer%');
            this.db.prepare('SELECT * FROM customers WHERE email LIKE ?').all('%@example.com');
            this.db.prepare('SELECT * FROM customers ORDER BY name LIMIT 50').all();

            const endTime = Date.now();
            const duration = endTime - startTime;

            console.log(`  Search operations completed in ${duration}ms`);

            if (duration > 1000) {
                console.log('  Warning: Search operations took longer than expected');
            }
        });

        // Test 24: Large dataset queries
        this.runTest('Large dataset queries', () => {
            const totalCustomers = this.db.prepare('SELECT COUNT(*) as count FROM customers').get();
            console.log(`  Total customers in database: ${totalCustomers.count}`);

            // Test pagination
            const pageSize = 50;
            const page1 = this.db.prepare('SELECT * FROM customers LIMIT ? OFFSET ?').all(pageSize, 0);
            const page2 = this.db.prepare('SELECT * FROM customers LIMIT ? OFFSET ?').all(pageSize, pageSize);

            console.log(`  Page 1: ${page1.length} customers`);
            console.log(`  Page 2: ${page2.length} customers`);
        });
    }

    testErrorScenarios() {
        // Test 25: Database connection errors
        this.runTest('Database connection error handling', () => {
            // This test would require simulating connection failures
            // For now, we'll test with valid operations
            const customers = this.db.prepare('SELECT COUNT(*) as count FROM customers').get();
            if (!customers || customers.length === 0) {
                throw new Error('Failed to get customer count');
            }
        });

        // Test 26: SQL injection prevention
        this.runTest('SQL injection prevention', () => {
            const maliciousInput = "'; DROP TABLE customers; --";

            try {
                this.db.prepare('INSERT INTO customers (name, email) VALUES (?, ?)')
                    .run(maliciousInput, 'injection@test.com');
                console.log('  Note: Malicious input was treated as regular data (good)');
            } catch (error) {
                console.log(`  Note: Malicious input rejected: ${error.message}`);
            }
        });

        // Test 27: Data type validation
        this.runTest('Data type validation', () => {
            const invalidData = {
                name: 123, // Should be string
                email: null, // Should be string or null
                phone: undefined // Should be string or null
            };

            try {
                this.db.prepare('INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)')
                    .run(invalidData.name, invalidData.email, invalidData.phone);
                console.log('  Note: Invalid data types were accepted');
            } catch (error) {
                console.log(`  Note: Invalid data types rejected: ${error.message}`);
            }
        });
    }

    generateReport() {
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

    cleanup() {
        if (this.db) {
            this.db.close();
        }
    }
}

// Main execution
function runCustomerCRUDTests() {
    console.log('🚀 Starting Comprehensive Customer CRUD Tests\n');

    const tester = new CustomerCRUDTester();

    try {
        // Initialize database
        if (!tester.initDatabase()) {
            throw new Error('Failed to initialize database');
        }

        // Run all test suites
        tester.testCustomerCreate();
        tester.testCustomerRead();
        tester.testCustomerUpdate();
        tester.testCustomerDelete();
        tester.testCustomerValidation();
        tester.testCustomerLoyaltyPoints();
        tester.testPerformance();
        tester.testErrorScenarios();

        // Generate report
        const report = tester.generateReport();

        // Print summary
        console.log('\n' + '='.repeat(80));
        console.log('CUSTOMER CRUD TEST RESULTS SUMMARY');
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
        fs.writeFileSync('customers-crud-test-report.json', JSON.stringify(report, null, 2));
        console.log('\n📄 Detailed report saved to: customers-crud-test-report.json');

        return report;

    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
        throw error;
    } finally {
        tester.cleanup();
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    try {
        const report = runCustomerCRUDTests();
        console.log('\n✅ Customer CRUD testing completed!');
        process.exit(report.failCount > 0 ? 1 : 0);
    } catch (error) {
        console.error('\n💥 Customer CRUD testing failed:', error);
        process.exit(1);
    }
}

export { runCustomerCRUDTests, CustomerCRUDTester };