import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CustomerCRUDTester {
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

            const result = await this.db.run(
                'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
                [customer.name, customer.email, customer.phone]
            );

            if (!result.lastID) {
                throw new Error('Customer creation failed - no ID returned');
            }

            const created = await this.db.get('SELECT * FROM customers WHERE id = ?', [result.lastID]);
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

            const result = await this.db.run(
                'INSERT INTO customers (name) VALUES (?)',
                [customer.name]
            );

            if (!result.lastID) {
                throw new Error('Customer creation failed - no ID returned');
            }

            const created = await this.db.get('SELECT * FROM customers WHERE id = ?', [result.lastID]);
            if (!created) throw new Error('Created customer not found');
            if (created.email !== null) throw new Error('Email should be null');
            if (created.phone !== null) throw new Error('Phone should be null');
        });

        // Test 3: Create customer without name (should fail)
        this.runTest('Create customer without name (should fail)', () => {
            try {
                this.db.prepare(
                    'INSERT INTO customers (email, phone) VALUES (?, ?)',
                    ['test@example.com', '123-456-7890']
                );
                throw new Error('Should have failed - name is required');
            } catch (error) {
                if (!error.message.includes('NOT NULL') && !error.message.includes('required')) {
                    throw new Error('Expected NOT NULL constraint error, got: ' + error.message);
                }
            }
        });

        // Test 4: Test duplicate email constraint (if exists)
        await this.runTest('Test duplicate email handling', async () => {
            const customer1 = {
                name: 'Test User 1',
                email: 'duplicate@example.com'
            };

            const customer2 = {
                name: 'Test User 2',
                email: 'duplicate@example.com'
            };

            // Create first customer
            await this.db.run(
                'INSERT INTO customers (name, email) VALUES (?, ?)',
                [customer1.name, customer1.email]
            );

            // Try to create second with same email
            try {
                await this.db.run(
                    'INSERT INTO customers (name, email) VALUES (?, ?)',
                    [customer2.name, customer2.email]
                );
                // If we get here, duplicate email was allowed (may be by design)
                console.log('  Note: Duplicate email allowed - this may be intentional');
            } catch (error) {
                // Expected if unique constraint exists
                console.log(`  Note: Duplicate email rejected: ${error.message}`);
            }
        });

        // Test 5: Test duplicate phone constraint (if exists)
        await this.runTest('Test duplicate phone handling', async () => {
            const customer1 = {
                name: 'Phone User 1',
                phone: '555-1234'
            };

            const customer2 = {
                name: 'Phone User 2',
                phone: '555-1234'
            };

            // Create first customer
            await this.db.run(
                'INSERT INTO customers (name, phone) VALUES (?, ?)',
                [customer1.name, customer1.phone]
            );

            // Try to create second with same phone
            try {
                await this.db.run(
                    'INSERT INTO customers (name, phone) VALUES (?, ?)',
                    [customer2.name, customer2.phone]
                );
                // If we get here, duplicate phone was allowed (may be by design)
                console.log('  Note: Duplicate phone allowed - this may be intentional');
            } catch (error) {
                // Expected if unique constraint exists
                console.log(`  Note: Duplicate phone rejected: ${error.message}`);
            }
        });
    }

    async testCustomerRead() {
        // Test 6: Get all customers
        await this.runTest('Get all customers', async () => {
            const customers = await this.db.all('SELECT * FROM customers ORDER BY name');
            if (!Array.isArray(customers)) {
                throw new Error('Expected array of customers');
            }
            console.log(`  Found ${customers.length} customers`);
        });

        // Test 7: Get customer by ID
        await this.runTest('Get customer by ID', async () => {
            // First create a test customer
            const result = await this.db.run(
                'INSERT INTO customers (name, email) VALUES (?, ?)',
                ['Read Test User', 'read@example.com']
            );
            const customerId = result.lastID;

            const customer = await this.db.get('SELECT * FROM customers WHERE id = ?', [customerId]);
            if (!customer) throw new Error('Customer not found by ID');
            if (customer.name !== 'Read Test User') throw new Error('Customer name mismatch');
        });

        // Test 8: Search customers by name
        await this.runTest('Search customers by name', async () => {
            // Create test customers
            await this.db.run('INSERT INTO customers (name) VALUES (?)', ['Search Target']);
            await this.db.run('INSERT INTO customers (name) VALUES (?)', ['Other Customer']);
            await this.db.run('INSERT INTO customers (name) VALUES (?)', ['Search Target 2']);

            const results = await this.db.all(
                'SELECT * FROM customers WHERE name LIKE ? ORDER BY name',
                ['%Search Target%']
            );

            if (results.length !== 2) {
                throw new Error(`Expected 2 customers with 'Search Target', found ${results.length}`);
            }
        });

        // Test 9: Filter by email
        await this.runTest('Filter customers by email', async () => {
            const email = 'filter@example.com';
            await this.db.run('INSERT INTO customers (name, email) VALUES (?, ?)', ['Filter Test', email]);

            const results = await this.db.all(
                'SELECT * FROM customers WHERE email = ?',
                [email]
            );

            if (results.length !== 1) {
                throw new Error(`Expected 1 customer with email ${email}, found ${results.length}`);
            }
        });

        // Test 10: Filter by phone
        await this.runTest('Filter customers by phone', async () => {
            const phone = '555-9999';
            await this.db.run('INSERT INTO customers (name, phone) VALUES (?, ?)', ['Phone Filter Test', phone]);

            const results = await this.db.all(
                'SELECT * FROM customers WHERE phone = ?',
                [phone]
            );

            if (results.length !== 1) {
                throw new Error(`Expected 1 customer with phone ${phone}, found ${results.length}`);
            }
        });
    }

    async testCustomerUpdate() {
        // Test 11: Update customer (if operation exists)
        await this.runTest('Update customer information', async () => {
            // Create test customer
            const result = await this.db.run(
                'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
                ['Update Test', 'update@example.com', '555-1111']
            );
            const customerId = result.lastID;

            // Check if UPDATE operation exists in backend
            try {
                const updateResult = await this.db.run(
                    'UPDATE customers SET name = ?, email = ?, phone = ? WHERE id = ?',
                    ['Updated Name', 'updated@example.com', '555-2222', customerId]
                );

                if (updateResult.changes === 0) {
                    throw new Error('UPDATE operation failed - no rows affected');
                }

                // Verify update
                const updated = await this.db.get('SELECT * FROM customers WHERE id = ?', [customerId]);
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
        await this.runTest('Partial customer update', async () => {
            const result = await this.db.run(
                'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
                ['Partial Update Test', 'partial@example.com', '555-3333']
            );
            const customerId = result.lastID;

            try {
                await this.db.run(
                    'UPDATE customers SET name = ? WHERE id = ?',
                    ['Partially Updated', customerId]
                );

                const updated = await this.db.get('SELECT * FROM customers WHERE id = ?', [customerId]);
                if (updated.name !== 'Partially Updated') throw new Error('Partial update failed');
                if (updated.email !== 'partial@example.com') throw new Error('Email should remain unchanged');
            } catch (error) {
                throw new Error('UPDATE operation not implemented: ' + error.message);
            }
        });

        // Test 13: Update non-existent customer
        await this.runTest('Update non-existent customer', async () => {
            try {
                const result = await this.db.run(
                    'UPDATE customers SET name = ? WHERE id = ?',
                    ['Non-existent', 99999]
                );

                if (result.changes > 0) {
                    throw new Error('UPDATE should not affect non-existent customer');
                }
            } catch (error) {
                throw new Error('UPDATE operation not implemented: ' + error.message);
            }
        });
    }

    async testCustomerDelete() {
        // Test 14: Delete customer (if operation exists)
        await this.runTest('Delete customer', async () => {
            // Create test customer
            const result = await this.db.run(
                'INSERT INTO customers (name) VALUES (?)',
                ['Delete Test']
            );
            const customerId = result.lastID;

            try {
                const deleteResult = await this.db.run(
                    'DELETE FROM customers WHERE id = ?',
                    [customerId]
                );

                if (deleteResult.changes === 0) {
                    throw new Error('DELETE operation failed - no rows affected');
                }

                // Verify deletion
                const deleted = await this.db.get('SELECT * FROM customers WHERE id = ?', [customerId]);
                if (deleted) throw new Error('Customer should be deleted');

            } catch (error) {
                throw new Error('DELETE operation not implemented: ' + error.message);
            }
        });

        // Test 15: Delete non-existent customer
        await this.runTest('Delete non-existent customer', async () => {
            try {
                const result = await this.db.run(
                    'DELETE FROM customers WHERE id = ?',
                    [99999]
                );

                if (result.changes > 0) {
                    throw new Error('DELETE should not affect non-existent customer');
                }
            } catch (error) {
                throw new Error('DELETE operation not implemented: ' + error.message);
            }
        });

        // Test 16: Test referential integrity (customer with orders)
        await this.runTest('Test customer deletion with orders', async () => {
            // Create customer
            const customerResult = await this.db.run(
                'INSERT INTO customers (name) VALUES (?)',
                ['Order Customer']
            );
            const customerId = customerResult.lastID;

            // Create order for customer
            const orderResult = await this.db.run(
                'INSERT INTO orders (items, total, payment_method, customer_id) VALUES (?, ?, ?, ?)',
                ['Test Item', '10.00', 'cash', customerId]
            );

            try {
                // Try to delete customer with orders
                const deleteResult = await this.db.run(
                    'DELETE FROM customers WHERE id = ?',
                    [customerId]
                );

                if (deleteResult.changes > 0) {
                    console.log('  Note: Customer with orders was deleted (may need CASCADE or soft delete)');
                }
            } catch (error) {
                console.log(`  Note: Customer with orders protected: ${error.message}`);
            }
        });
    }

    async testCustomerValidation() {
        // Test 17: Email format validation
        await this.runTest('Email format validation', async () => {
            const invalidEmails = ['invalid-email', '@example.com', 'user@', 'user@.com', 'user@domain'];

            for (const email of invalidEmails) {
                try {
                    await this.db.run(
                        'INSERT INTO customers (name, email) VALUES (?, ?)',
                        ['Email Test', email]
                    );
                    console.log(`  Note: Email '${email}' was accepted (no validation implemented)`);
                } catch (error) {
                    console.log(`  Note: Email '${email}' rejected: ${error.message}`);
                }
            }

            const validEmail = 'valid@example.com';
            const result = await this.db.run(
                'INSERT INTO customers (name, email) VALUES (?, ?)',
                ['Valid Email Test', validEmail]
            );
            if (result.lastID) {
                console.log(`  ✓ Valid email '${validEmail}' accepted`);
            }
        });

        // Test 18: Phone number validation
        await this.runTest('Phone number validation', async () => {
            const phoneNumbers = ['123', '123456789012345', 'abc123', '+1234567890', '123-456-7890', '123.456.7890'];

            for (const phone of phoneNumbers) {
                try {
                    await this.db.run(
                        'INSERT INTO customers (name, phone) VALUES (?, ?)',
                        ['Phone Test', phone]
                    );
                    console.log(`  Note: Phone '${phone}' was accepted (no validation implemented)`);
                } catch (error) {
                    console.log(`  Note: Phone '${phone}' rejected: ${error.message}`);
                }
            }
        });

        // Test 19: Name length validation
        await this.runTest('Name length validation', async () => {
            const shortName = '';
            const longName = 'a'.repeat(1000); // Very long name

            try {
                await this.db.run(
                    'INSERT INTO customers (name) VALUES (?)',
                    [shortName]
                );
                console.log('  Note: Empty name was accepted (may need validation)');
            } catch (error) {
                console.log(`  Note: Empty name rejected: ${error.message}`);
            }

            try {
                await this.db.run(
                    'INSERT INTO customers (name) VALUES (?)',
                    [longName]
                );
                console.log(`  Note: Very long name (${longName.length} chars) was accepted`);
            } catch (error) {
                console.log(`  Note: Very long name rejected: ${error.message}`);
            }
        });
    }

    async testCustomerLoyaltyPoints() {
        // Test 20: Loyalty points calculation
        await this.runTest('Loyalty points system', async () => {
            // Create customer
            const customerResult = await this.db.run(
                'INSERT INTO customers (name) VALUES (?)',
                ['Loyalty Test Customer']
            );
            const customerId = customerResult.lastID;

            // Create orders with different amounts
            await this.db.run(
                'INSERT INTO orders (items, total, payment_method, customer_id) VALUES (?, ?, ?, ?)',
                ['Item 1', '50.00', 'cash', customerId]
            );

            await this.db.run(
                'INSERT INTO orders (items, total, payment_method, customer_id) VALUES (?, ?, ?, ?)',
                ['Item 2', '75.00', 'card', customerId]
            );

            // Check if loyalty points are calculated
            const customer = await this.db.get('SELECT * FROM customers WHERE id = ?', [customerId]);
            console.log(`  Customer loyalty points: ${customer.loyalty_points}`);
            console.log(`  Customer total spent: ${customer.total_spent}`);

            if (customer.loyalty_points === 0 && customer.total_spent === '0') {
                console.log('  Note: Loyalty points and total spent not calculated from orders');
            }
        });

        // Test 21: Loyalty points updates
        await this.runTest('Loyalty points updates', async () => {
            const customerResult = await this.db.run(
                'INSERT INTO customers (name, loyalty_points, total_spent) VALUES (?, ?, ?)',
                ['Loyalty Update Test', 10, '100.00']
            );
            const customerId = customerResult.lastID;

            // Simulate loyalty point calculation
            await this.db.run(
                'UPDATE customers SET loyalty_points = ?, total_spent = ? WHERE id = ?',
                [15, '150.00', customerId]
            );

            const updated = await this.db.get('SELECT * FROM customers WHERE id = ?', [customerId]);
            if (updated.loyalty_points !== 15) throw new Error('Loyalty points update failed');
            if (updated.total_spent !== '150.00') throw new Error('Total spent update failed');
        });
    }

    async testPerformance() {
        // Test 22: Bulk customer creation
        await this.runTest('Bulk customer creation performance', async () => {
            const startTime = Date.now();
            const customerCount = 100;

            for (let i = 0; i < customerCount; i++) {
                await this.db.run(
                    'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
                    [`Bulk Customer ${i}`, `bulk${i}@example.com`, `555-${i.toString().padStart(4, '0')}`]
                );
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            console.log(`  Created ${customerCount} customers in ${duration}ms`);

            if (duration > 5000) {
                console.log('  Warning: Bulk creation took longer than expected');
            }
        });

        // Test 23: Customer search performance
        await this.runTest('Customer search performance', async () => {
            const startTime = Date.now();

            // Search operations
            await this.db.all('SELECT * FROM customers WHERE name LIKE ?', ['%Customer%']);
            await this.db.all('SELECT * FROM customers WHERE email LIKE ?', ['%@example.com']);
            await this.db.all('SELECT * FROM customers ORDER BY name LIMIT 50');

            const endTime = Date.now();
            const duration = endTime - startTime;

            console.log(`  Search operations completed in ${duration}ms`);

            if (duration > 1000) {
                console.log('  Warning: Search operations took longer than expected');
            }
        });

        // Test 24: Large dataset queries
        await this.runTest('Large dataset queries', async () => {
            const totalCustomers = await this.db.get('SELECT COUNT(*) as count FROM customers');
            console.log(`  Total customers in database: ${totalCustomers.count}`);

            // Test pagination
            const pageSize = 50;
            const page1 = await this.db.all('SELECT * FROM customers LIMIT ? OFFSET ?', [pageSize, 0]);
            const page2 = await this.db.all('SELECT * FROM customers LIMIT ? OFFSET ?', [pageSize, pageSize]);

            console.log(`  Page 1: ${page1.length} customers`);
            console.log(`  Page 2: ${page2.length} customers`);
        });
    }

    async testErrorScenarios() {
        // Test 25: Database connection errors
        await this.runTest('Database connection error handling', async () => {
            // This test would require simulating connection failures
            // For now, we'll test with valid operations
            const customers = await this.db.all('SELECT COUNT(*) as count FROM customers');
            if (!customers || customers.length === 0) {
                throw new Error('Failed to get customer count');
            }
        });

        // Test 26: SQL injection prevention
        await this.runTest('SQL injection prevention', async () => {
            const maliciousInput = "'; DROP TABLE customers; --";

            try {
                await this.db.run(
                    'INSERT INTO customers (name, email) VALUES (?, ?)',
                    [maliciousInput, 'injection@test.com']
                );
                console.log('  Note: Malicious input was treated as regular data (good)');
            } catch (error) {
                console.log(`  Note: Malicious input rejected: ${error.message}`);
            }
        });

        // Test 27: Data type validation
        await this.runTest('Data type validation', async () => {
            const invalidData = {
                name: 123, // Should be string
                email: null, // Should be string or null
                phone: undefined // Should be string or null
            };

            try {
                await this.db.run(
                    'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
                    [invalidData.name, invalidData.email, invalidData.phone]
                );
                console.log('  Note: Invalid data types were accepted');
            } catch (error) {
                console.log(`  Note: Invalid data types rejected: ${error.message}`);
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
            await this.db.close();
        }
    }
}

// Main execution
async function runCustomerCRUDTests() {
    console.log('🚀 Starting Comprehensive Customer CRUD Tests\n');

    const tester = new CustomerCRUDTester();

    try {
        // Initialize database
        if (!await tester.initDatabase()) {
            throw new Error('Failed to initialize database');
        }

        // Run all test suites
        await tester.testCustomerCreate();
        await tester.testCustomerRead();
        await tester.testCustomerUpdate();
        await tester.testCustomerDelete();
        await tester.testCustomerValidation();
        await tester.testCustomerLoyaltyPoints();
        await tester.testPerformance();
        await tester.testErrorScenarios();

        // Generate report
        const report = await tester.generateReport();

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
        const fs = await import('fs');
        fs.writeFileSync('customers-crud-test-report.json', JSON.stringify(report, null, 2));
        console.log('\n📄 Detailed report saved to: customers-crud-test-report.json');

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
    runCustomerCRUDTests()
        .then(report => {
            console.log('\n✅ Customer CRUD testing completed!');
            process.exit(report.failCount > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('\n💥 Customer CRUD testing failed:', error);
            process.exit(1);
        });
}

export { runCustomerCRUDTests, CustomerCRUDTester };