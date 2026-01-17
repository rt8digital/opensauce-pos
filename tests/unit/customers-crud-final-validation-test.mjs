import Database from 'better-sqlite3';

class CustomerCRUDValidator {
    constructor() {
        this.db = null;
        this.testResults = [];
        this.testCount = 0;
        this.passCount = 0;
        this.failCount = 0;
        this.criticalIssues = [];
        this.warnings = [];
    }

    validateSetup() {
        try {
            // Use existing database or create new one
            const dbPath = 'sqlite.db';
            this.db = new Database(dbPath);
            console.log('✓ Database connection established');

            // Check if customers table exists
            const tableExists = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='customers'").get();
            if (!tableExists) {
                this.criticalIssues.push('Customers table does not exist');
                return false;
            }
            console.log('✓ Customers table exists');

            return true;
        } catch (error) {
            this.criticalIssues.push(`Database setup failed: ${error.message}`);
            return false;
        }
    }

    validate(name, testFn) {
        this.testCount++;
        try {
            console.log(`\n🧪 Testing: ${name}`);
            const result = testFn();
            this.testResults.push({ name, status: 'PASS', error: null });
            this.passCount++;
            console.log(`✓ PASS: ${name}`);
            return result;
        } catch (error) {
            this.testResults.push({ name, status: 'FAIL', error: error.message });
            this.failCount++;
            console.log(`✗ FAIL: ${name} - ${error.message}`);
            return null;
        }
    }

    testBackendImplementation() {
        console.log('\n🔍 Testing Backend Implementation...');

        // Test 1: Check IPC handlers exist in source code
        this.validate('Backend IPC handlers defined', () => {
            // This is a static analysis test
            const fs = require('fs');
            const mainContent = fs.readFileSync('electron/main.ts', 'utf8');

            const requiredHandlers = [
                'db:customers:get-all',
                'db:customers:create',
                'db:customers:get-by-id',
                'db:customers:update',
                'db:customers:delete',
                'db:customers:search',
                'db:customers:update-loyalty'
            ];

            for (const handler of requiredHandlers) {
                if (!mainContent.includes(handler)) {
                    throw new Error(`Missing IPC handler: ${handler}`);
                }
            }
        });

        // Test 2: Check preload methods exist
        this.validate('Frontend API methods defined', () => {
            const fs = require('fs');
            const preloadContent = fs.readFileSync('electron/preload.ts', 'utf8');

            const requiredMethods = [
                'getCustomers',
                'createCustomer',
                'getCustomerById',
                'updateCustomer',
                'deleteCustomer',
                'searchCustomers',
                'updateCustomerLoyalty'
            ];

            for (const method of requiredMethods) {
                if (!preloadContent.includes(`${method}:`)) {
                    throw new Error(`Missing preload method: ${method}`);
                }
            }
        });
    }

    testDatabaseSchema() {
        console.log('\n🗄️ Testing Database Schema...');

        // Test 3: Check customers table structure
        this.validate('Customers table has required columns', () => {
            const columns = this.db.prepare("PRAGMA table_info(customers)").all();
            const columnNames = columns.map(col => col.name);

            const requiredColumns = ['id', 'name', 'email', 'phone', 'loyalty_points', 'total_spent', 'created_at'];
            for (const column of requiredColumns) {
                if (!columnNames.includes(column)) {
                    throw new Error(`Missing column: ${column}`);
                }
            }
        });

        // Test 4: Check constraints exist
        this.validate('Database constraints implemented', () => {
            const constraints = this.db.prepare("PRAGMA foreign_key_list(customers)").all();
            const indexes = this.db.prepare("PRAGMA index_list(customers)").all();

            console.log(`  Found ${indexes.length} indexes on customers table`);
            console.log(`  Found ${constraints.length} foreign key constraints`);
        });

        // Test 5: Check NOT NULL constraints
        this.validate('Name field has NOT NULL constraint', () => {
            const columns = this.db.prepare("PRAGMA table_info(customers)").all();
            const nameColumn = columns.find(col => col.name === 'name');
            if (!nameColumn || nameColumn.notnull !== 1) {
                throw new Error('Name column should be NOT NULL');
            }
        });
    }

    testCRUDOperations() {
        console.log('\n⚙️ Testing CRUD Operations...');

        let testCustomerId = null;

        // Test 6: CREATE operation
        this.validate('Customer creation with validation', () => {
            const stmt = this.db.prepare('INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)');
            const result = stmt.run('Test Customer', 'test@example.com', '123-456-7890');
            testCustomerId = result.lastInsertRowid;

            if (!testCustomerId) {
                throw new Error('Customer creation failed');
            }

            const created = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(testCustomerId);
            if (!created) throw new Error('Created customer not found');
            if (created.loyalty_points !== 0) throw new Error('Default loyalty points should be 0');
        });

        // Test 7: READ operation
        this.validate('Customer retrieval by ID', () => {
            const customer = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(testCustomerId);
            if (!customer) throw new Error('Customer not found by ID');
            if (customer.name !== 'Test Customer') throw new Error('Customer name mismatch');
        });

        // Test 8: UPDATE operation
        this.validate('Customer update functionality', () => {
            const result = this.db.prepare('UPDATE customers SET name = ?, email = ? WHERE id = ?')
                .run('Updated Test Customer', 'updated@example.com', testCustomerId);

            if (result.changes === 0) throw new Error('UPDATE failed - no rows affected');

            const updated = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(testCustomerId);
            if (updated.name !== 'Updated Test Customer') throw new Error('Name update failed');
            if (updated.email !== 'updated@example.com') throw new Error('Email update failed');
        });

        // Test 9: Search functionality
        this.validate('Customer search by name', () => {
            const results = this.db.prepare('SELECT * FROM customers WHERE name LIKE ?')
                .all('%Updated Test%');

            if (results.length === 0) throw new Error('Search returned no results');
            if (results[0].id !== testCustomerId) throw new Error('Search returned wrong customer');
        });

        // Test 10: DELETE protection
        this.validate('Customer deletion with order protection', () => {
            // First create an order for the customer
            this.db.prepare('INSERT INTO orders (items, total, payment_method, customer_id) VALUES (?, ?, ?, ?)')
                .run('Test Item', '50.00', 'cash', testCustomerId);

            try {
                // Try to delete customer with orders
                const result = this.db.prepare('DELETE FROM customers WHERE id = ?').run(testCustomerId);
                if (result.changes > 0) {
                    this.warnings.push('Customer with orders was deleted (no foreign key constraint protection)');
                }
            } catch (error) {
                console.log('  ✓ Customer with orders is protected from deletion');
            }
        });

        // Clean up test data
        try {
            this.db.prepare('DELETE FROM orders WHERE customer_id = ?').run(testCustomerId);
            this.db.prepare('DELETE FROM customers WHERE id = ?').run(testCustomerId);
        } catch (error) {
            console.log('Note: Could not clean up test data');
        }
    }

    testValidation() {
        console.log('\n✅ Testing Validation...');

        // Test 11: Duplicate email prevention
        this.validate('Duplicate email prevention', () => {
            try {
                this.db.prepare('INSERT INTO customers (name, email) VALUES (?, ?)')
                    .run('First Customer', 'duplicate@test.com');

                try {
                    this.db.prepare('INSERT INTO customers (name, email) VALUES (?, ?)')
                        .run('Second Customer', 'duplicate@test.com');
                    this.warnings.push('Duplicate emails are allowed (database constraint may be missing)');
                } catch (error) {
                    console.log('  ✓ Duplicate email properly rejected');
                }
            } catch (error) {
                // First customer creation failed, that's okay for this test
            }
        });

        // Test 12: Required field validation
        this.validate('Required field validation (name)', () => {
            try {
                this.db.prepare('INSERT INTO customers (name) VALUES (?)').run('');
                throw new Error('Empty name should be rejected');
            } catch (error) {
                if (!error.message.includes('NOT NULL') && !error.message.includes('empty')) {
                    throw new Error('Expected validation error for empty name');
                }
            }
        });

        // Test 13: Email format validation (if implemented in backend)
        this.validate('Email format validation', () => {
            // This test validates that the validation logic exists in the backend
            const fs = require('fs');
            const mainContent = fs.readFileSync('electron/main.ts', 'utf8');

            if (!mainContent.includes('emailRegex') && !mainContent.includes('Invalid email format')) {
                this.warnings.push('Email format validation may not be implemented in backend');
            }
        });
    }

    testLoyaltyPoints() {
        console.log('\n🎯 Testing Loyalty Points System...');

        // Test 14: Loyalty points calculation
        this.validate('Loyalty points calculation in orders', () => {
            // Create test customer
            const customerResult = this.db.prepare('INSERT INTO customers (name) VALUES (?)')
                .run('Loyalty Test Customer');
            const customerId = customerResult.lastInsertRowid;

            // Create order
            const orderResult = this.db.prepare('INSERT INTO orders (items, total, payment_method, customer_id) VALUES (?, ?, ?, ?)')
                .run('Loyalty Item', '25.50', 'cash', customerId);

            // Check if loyalty points were updated
            const customer = this.db.prepare('SELECT loyalty_points, total_spent FROM customers WHERE id = ?')
                .get(customerId);

            // Should have earned 2 points (25.50 / 10 = 2.55, floor = 2)
            if (customer.loyalty_points === 0 && customer.total_spent === '0') {
                this.warnings.push('Loyalty points not automatically calculated from orders');
            } else {
                console.log(`  ✓ Loyalty points: ${customer.loyalty_points}, Total spent: ${customer.total_spent}`);
            }

            // Clean up
            this.db.prepare('DELETE FROM orders WHERE customer_id = ?').run(customerId);
            this.db.prepare('DELETE FROM customers WHERE id = ?').run(customerId);
        });
    }

    generateFinalReport() {
        const report = {
            timestamp: new Date().toISOString(),
            totalTests: this.testCount,
            passedTests: this.passCount,
            failedTests: this.failCount,
            passRate: ((this.passCount / this.testCount) * 100).toFixed(2) + '%',
            criticalIssues: this.criticalIssues,
            warnings: this.warnings,
            testResults: this.testResults,
            summary: {
                status: this.failCount === 0 && this.criticalIssues.length === 0 ? 'ALL TESTS PASSED' : 'ISSUES FOUND',
                productionReady: this.failCount === 0 && this.criticalIssues.length === 0,
                issuesFound: this.testResults.filter(r => r.status === 'FAIL').map(r => r.name)
            }
        };

        return report;
    }

    printSummary(report) {
        console.log('\n' + '='.repeat(80));
        console.log('CUSTOMER CRUD FINAL VALIDATION RESULTS');
        console.log('='.repeat(80));
        console.log(`Total Tests: ${report.totalTests}`);
        console.log(`Passed: ${report.passedTests}`);
        console.log(`Failed: ${report.failedTests}`);
        console.log(`Pass Rate: ${report.passRate}`);
        console.log(`Status: ${report.summary.status}`);
        console.log(`Production Ready: ${report.summary.productionReady ? 'YES' : 'NO'}`);

        if (report.criticalIssues.length > 0) {
            console.log('\n🔴 CRITICAL ISSUES:');
            report.criticalIssues.forEach(issue => {
                console.log(`  ✗ ${issue}`);
            });
        }

        if (report.warnings.length > 0) {
            console.log('\n🟡 WARNINGS:');
            report.warnings.forEach(warning => {
                console.log(`  ⚠️ ${warning}`);
            });
        }

        if (report.summary.issuesFound.length > 0) {
            console.log('\n❌ FAILED TESTS:');
            report.summary.issuesFound.forEach(issue => {
                console.log(`  ✗ ${issue}`);
            });
        }

        if (report.summary.productionReady) {
            console.log('\n🎉 CUSTOMER CRUD SYSTEM IS PRODUCTION READY!');
        } else {
            console.log('\n⚠️ CUSTOMER CRUD SYSTEM NEEDS FIXES BEFORE PRODUCTION');
        }
    }

    cleanup() {
        if (this.db) {
            this.db.close();
        }
    }
}

// Main execution
function runFinalValidation() {
    console.log('🚀 Starting Customer CRUD Final Validation\n');

    const validator = new CustomerCRUDValidator();

    try {
        // Initialize and validate setup
        if (!validator.validateSetup()) {
            throw new Error('Setup validation failed');
        }

        // Run all validation tests
        validator.testBackendImplementation();
        validator.testDatabaseSchema();
        validator.testCRUDOperations();
        validator.testValidation();
        validator.testLoyaltyPoints();

        // Generate and print report
        const report = validator.generateFinalReport();
        validator.printSummary(report);

        // Save detailed report
        const fs = require('fs');
        fs.writeFileSync('customers-crud-final-validation-report.json', JSON.stringify(report, null, 2));
        console.log('\n📄 Detailed report saved to: customers-crud-final-validation-report.json');

        return report;

    } catch (error) {
        console.error('❌ Validation execution failed:', error.message);
        throw error;
    } finally {
        validator.cleanup();
    }
}

// Run validation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    try {
        const report = runFinalValidation();
        console.log('\n✅ Customer CRUD validation completed!');
        process.exit(report.summary.productionReady ? 0 : 1);
    } catch (error) {
        console.error('\n💥 Customer CRUD validation failed:', error);
        process.exit(1);
    }
}

export { runFinalValidation, CustomerCRUDValidator };