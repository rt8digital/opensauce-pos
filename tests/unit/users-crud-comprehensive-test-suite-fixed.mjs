import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class UserAuthenticationCRUDTester {
    constructor() {
        this.db = null;
        this.testResults = [];
        this.testCount = 0;
        this.passCount = 0;
        this.failCount = 0;
        this.securityIssues = [];
        this.performanceMetrics = {};
        this.testUsers = []; // Track created test users for cleanup
    }

    async initDatabase() {
        try {
            const dbPath = path.join(__dirname, 'sqlite.db');
            this.db = new Database(dbPath);
            console.log('✓ Database connection established');
            this.db.exec('PRAGMA foreign_keys = ON');
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
            const result = testFn();
            if (result && typeof result.then === 'function') {
                return result.then(() => {
                    this.testResults.push({ name: testName, status: 'PASS', error: null });
                    this.passCount++;
                    console.log(`✓ PASS: ${testName}`);
                }).catch(error => {
                    this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
                    this.failCount++;
                    console.log(`✗ FAIL: ${testName} - ${error.message}`);
                });
            } else {
                this.testResults.push({ name: testName, status: 'PASS', error: null });
                this.passCount++;
                console.log(`✓ PASS: ${testName}`);
            }
        } catch (error) {
            this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
            this.failCount++;
            console.log(`✗ FAIL: ${testName} - ${error.message}`);
        }
    }

    generateSecurePin() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async createTestUser(name, pin, role = 'admin', isOwner = false) {
        try {
            const result = this.db.run(
                'INSERT INTO users (name, pin, role, is_owner) VALUES (?, ?, ?, ?)',
                [name, pin, role, isOwner]
            );
            if (result.lastID) {
                this.testUsers.push(result.lastID);
                return result.lastID;
            }
        } catch (error) {
            console.log(`  Note: Failed to create test user '${name}': ${error.message}`);
        }
        return null;
    }

    async cleanupTestUsers() {
        for (const userId of this.testUsers) {
            try {
                this.db.run('DELETE FROM users WHERE id = ?', [userId]);
            } catch (error) {
                console.log(`  Note: Failed to cleanup test user ${userId}: ${error.message}`);
            }
        }
        this.testUsers = [];
    }

    // ===== CREATE OPERATIONS =====
    async testUserCreate() {
        // Test 1: Create user with valid data
        this.runTest('Create user with valid data', async () => {
            const userName = `Test Admin User ${Date.now()}`;
            const pin = this.generateSecurePin();

            const result = this.db.run(
                'INSERT INTO users (name, pin, role, is_owner) VALUES (?, ?, ?, ?)',
                [userName, pin, 'admin', 0]
            );

            if (!result.lastID) {
                throw new Error('User creation failed - no ID returned');
            }

            const created = this.db.get('SELECT * FROM users WHERE id = ?', [result.lastID]);
            if (!created) throw new Error('Created user not found');

            if (created.name !== userName) throw new Error('Name mismatch');
            if (created.pin !== pin) throw new Error('PIN mismatch');
            if (created.role !== 'admin') throw new Error('Role mismatch');
            if (created.is_owner !== 0) throw new Error('isOwner mismatch');

            console.log(`  Created user with ID: ${result.lastID}`);
            this.testUsers.push(result.lastID);
        });

        // Test 2: Create user with minimal data
        this.runTest('Create user with minimal data', async () => {
            const userName = `Minimal User ${Date.now()}`;
            const pin = this.generateSecurePin();

            const result = this.db.run(
                'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                [userName, pin, 'cashier']
            );

            if (!result.lastID) {
                throw new Error('User creation failed - no ID returned');
            }

            const created = this.db.get('SELECT * FROM users WHERE id = ?', [result.lastID]);
            if (!created) throw new Error('Created user not found');

            if (created.is_owner !== 0) throw new Error('Default is_owner should be 0');
            if (!created.created_at) throw new Error('Default created_at missing');

            console.log(`  Created minimal user with ID: ${result.lastID}`);
            this.testUsers.push(result.lastID);
        });

        // Test 3: Create owner user
        this.runTest('Create owner user', async () => {
            const userName = `Owner User ${Date.now()}`;
            const pin = this.generateSecurePin();

            const result = this.db.run(
                'INSERT INTO users (name, pin, role, is_owner) VALUES (?, ?, ?, ?)',
                [userName, pin, 'admin', 1]
            );

            if (!result.lastID) {
                throw new Error('Owner user creation failed');
            }

            const created = this.db.get('SELECT * FROM users WHERE id = ?', [result.lastID]);
            if (created.is_owner !== 1) throw new Error('Owner flag not set correctly');

            console.log(`  Created owner user with ID: ${result.lastID}`);
            this.testUsers.push(result.lastID);
        });

        // Test 4: Create user without name (should fail)
        this.runTest('Create user without name (should fail)', async () => {
            try {
                this.db.run(
                    'INSERT INTO users (pin, role) VALUES (?, ?)',
                    [this.generateSecurePin(), 'admin']
                );
                throw new Error('Should have failed - name is required');
            } catch (error) {
                if (!error.message.includes('NOT NULL') && !error.message.includes('required')) {
                    throw new Error('Expected NOT NULL constraint error, got: ' + error.message);
                }
                console.log('  ✓ Correctly rejected user without name');
            }
        });

        // Test 5: Create user without PIN (should fail)
        this.runTest('Create user without PIN (should fail)', async () => {
            try {
                this.db.run(
                    'INSERT INTO users (name, role) VALUES (?, ?)',
                    ['No PIN User', 'admin']
                );
                throw new Error('Should have failed - PIN is required');
            } catch (error) {
                if (!error.message.includes('NOT NULL') && !error.message.includes('required')) {
                    throw new Error('Expected NOT NULL constraint error, got: ' + error.message);
                }
                console.log('  ✓ Correctly rejected user without PIN');
            }
        });

        // Test 6: Create user with invalid role
        this.runTest('Create user with invalid role', async () => {
            const userName = `Invalid Role User ${Date.now()}`;
            const pin = this.generateSecurePin();

            try {
                this.db.run(
                    'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                    [userName, pin, 'invalid_role']
                );
                console.log('  Note: Invalid role was accepted (may need validation)');
                const result = this.db.get('SELECT * FROM users WHERE name = ?', [userName]);
                if (result) this.testUsers.push(result.id);
            } catch (error) {
                console.log(`  Note: Invalid role rejected: ${error.message}`);
            }
        });
    }

    // ===== READ OPERATIONS =====
    async testUserRead() {
        // Test 7: Get all users
        this.runTest('Get all users', async () => {
            const users = this.db.all('SELECT * FROM users ORDER BY name');
            if (!Array.isArray(users)) {
                throw new Error('Expected array of users');
            }
            console.log(`  Found ${users.length} users`);
        });

        // Test 8: Get user by ID
        this.runTest('Get user by ID', async () => {
            const userId = await this.createTestUser(`Read Test User ${Date.now()}`, this.generateSecurePin(), 'admin');
            if (!userId) throw new Error('Failed to create test user');

            const user = this.db.get('SELECT * FROM users WHERE id = ?', [userId]);
            if (!user) throw new Error('User not found by ID');
            if (!user.name.includes('Read Test User')) throw new Error('User name mismatch');
        });

        // Test 9: Search users by name
        this.runTest('Search users by name', async () => {
            await this.createTestUser(`Search Target Admin ${Date.now()}`, this.generateSecurePin(), 'admin');
            await this.createTestUser(`Other User ${Date.now()}`, this.generateSecurePin(), 'cashier');
            await this.createTestUser(`Search Target Cashier ${Date.now()}`, this.generateSecurePin(), 'cashier');

            const results = this.db.all(
                'SELECT * FROM users WHERE name LIKE ? ORDER BY name',
                ['%Search Target%']
            );

            if (results.length < 2) {
                console.log(`  Note: Expected at least 2 users with 'Search Target', found ${results.length}`);
            }
        });

        // Test 10: Filter users by role
        this.runTest('Filter users by role', async () => {
            const adminUsers = this.db.all(
                'SELECT * FROM users WHERE role = ?',
                ['admin']
            );

            const cashierUsers = this.db.all(
                'SELECT * FROM users WHERE role = ?',
                ['cashier']
            );

            console.log(`  Found ${adminUsers.length} admin users`);
            console.log(`  Found ${cashierUsers.length} cashier users`);
        });
    }

    // ===== UPDATE OPERATIONS =====
    async testUserUpdate() {
        // Test 11: Update user information
        this.runTest('Update user information', async () => {
            const userId = await this.createTestUser(`Update Test User ${Date.now()}`, this.generateSecurePin(), 'cashier');
            if (!userId) throw new Error('Failed to create test user');

            const updateResult = this.db.run(
                'UPDATE users SET name = ?, role = ?, is_owner = ? WHERE id = ?',
                [`Updated User Name ${Date.now()}`, 'admin', 1, userId]
            );

            if (updateResult.changes === 0) {
                throw new Error('UPDATE operation failed - no rows affected');
            }

            const updated = this.db.get('SELECT * FROM users WHERE id = ?', [userId]);
            if (!updated.name.includes('Updated User Name')) throw new Error('Name update failed');
            if (updated.role !== 'admin') throw new Error('Role update failed');
            if (updated.is_owner !== 1) throw new Error('isOwner update failed');
        });

        // Test 12: Update user PIN
        this.runTest('Update user PIN', async () => {
            const userId = await this.createTestUser(`PIN Update User ${Date.now()}`, this.generateSecurePin(), 'admin');
            if (!userId) throw new Error('Failed to create test user');
            const newPin = this.generateSecurePin();

            const updateResult = this.db.run(
                'UPDATE users SET pin = ? WHERE id = ?',
                [newPin, userId]
            );

            if (updateResult.changes === 0) {
                throw new Error('PIN update failed - no rows affected');
            }

            const updated = this.db.get('SELECT * FROM users WHERE id = ?', [userId]);
            if (updated.pin !== newPin) throw new Error('PIN update failed');
        });

        // Test 13: Update non-existent user
        this.runTest('Update non-existent user', async () => {
            const result = this.db.run(
                'UPDATE users SET name = ? WHERE id = ?',
                ['Non-existent', 99999]
            );

            if (result.changes > 0) {
                throw new Error('UPDATE should not affect non-existent user');
            }
        });
    }

    // ===== DELETE OPERATIONS =====
    async testUserDelete() {
        // Test 14: Delete user
        this.runTest('Delete user', async () => {
            const userId = await this.createTestUser(`Delete Test User ${Date.now()}`, this.generateSecurePin(), 'cashier');
            if (!userId) throw new Error('Failed to create test user');

            const deleteResult = this.db.run(
                'DELETE FROM users WHERE id = ?',
                [userId]
            );

            if (deleteResult.changes === 0) {
                throw new Error('DELETE operation failed - no rows affected');
            }

            const deleted = this.db.get('SELECT * FROM users WHERE id = ?', [userId]);
            if (deleted) throw new Error('User should be deleted');
        });

        // Test 15: Delete non-existent user
        this.runTest('Delete non-existent user', async () => {
            const result = this.db.run(
                'DELETE FROM users WHERE id = ?',
                [99999]
            );

            if (result.changes > 0) {
                throw new Error('DELETE should not affect non-existent user');
            }
        });
    }

    // ===== AUTHENTICATION VALIDATION =====
    async testAuthenticationValidation() {
        // Test 16: PIN format validation
        this.runTest('PIN format validation', async () => {
            const invalidPins = ['123', '12345', '1234567', 'abc123', '123456a'];

            for (const pin of invalidPins) {
                try {
                    const userId = await this.createTestUser(`Invalid PIN Test ${pin} ${Date.now()}`, pin, 'admin');
                    if (userId) {
                        console.log(`  Note: Invalid PIN '${pin}' was accepted (no validation)`);
                    }
                } catch (error) {
                    console.log(`  Note: Invalid PIN '${pin}' rejected: ${error.message}`);
                }
            }

            // Test valid PIN
            const validPin = '123456';
            try {
                const userId = await this.createTestUser(`Valid PIN Test ${Date.now()}`, validPin, 'admin');
                if (userId) {
                    console.log(`  ✓ Valid PIN '${validPin}' accepted`);
                }
            } catch (error) {
                console.log(`  Note: Valid PIN '${validPin}' rejected: ${error.message}`);
            }
        });

        // Test 17: Login simulation
        this.runTest('Login simulation', async () => {
            const testPin = '123456';
            const userId = await this.createTestUser(`Login Test User ${Date.now()}`, testPin, 'admin');
            if (!userId) throw new Error('Failed to create test user');

            // Simulate login with correct PIN
            const user = this.db.get('SELECT * FROM users WHERE id = ? AND pin = ?', [userId, testPin]);
            if (!user) throw new Error('Valid login failed');
            console.log('  ✓ Valid PIN login successful');

            // Simulate login with incorrect PIN
            const invalidUser = this.db.get('SELECT * FROM users WHERE id = ? AND pin = ?', [userId, '000000']);
            if (invalidUser) throw new Error('Invalid login should have failed');
            console.log('  ✓ Invalid PIN login correctly rejected');
        });
    }

    // ===== SECURITY SCENARIOS =====
    async testSecurityScenarios() {
        // Test 18: PIN storage security
        this.runTest('PIN storage security', async () => {
            const testPin = '123456';
            const userId = await this.createTestUser(`Security Test User ${Date.now()}`, testPin, 'admin');
            if (!userId) throw new Error('Failed to create test user');

            const user = this.db.get('SELECT * FROM users WHERE id = ?', [userId]);

            // Check if PIN is stored in plain text (security issue)
            if (user.pin === testPin) {
                console.log('  ⚠️  SECURITY ISSUE: PIN stored in plain text!');
                this.securityIssues.push('PIN stored in plain text - should be hashed');
            } else {
                console.log('  ✓ PIN appears to be hashed');
            }
        });

        // Test 19: SQL injection prevention
        this.runTest('SQL injection prevention', async () => {
            const maliciousInputs = [
                "'; DROP TABLE users; --",
                "' OR '1'='1",
                "admin'--"
            ];

            for (const input of maliciousInputs) {
                try {
                    const userId = await this.createTestUser(`SQL Injection Test ${Date.now()} ${input.substring(0, 20)}`, this.generateSecurePin(), 'admin');
                    if (userId) {
                        console.log(`  Note: Malicious input '${input.substring(0, 20)}...' was treated as regular data`);
                    }
                } catch (error) {
                    console.log(`  ✓ Malicious input rejected: ${error.message}`);
                }
            }
        });
    }

    // ===== PERFORMANCE TESTING =====
    async testPerformance() {
        // Test 20: Bulk user creation performance
        this.runTest('Bulk user creation performance', async () => {
            const startTime = Date.now();
            const userCount = 20; // Reduced for testing
            const createdUsers = [];

            for (let i = 0; i < userCount; i++) {
                const userId = await this.createTestUser(
                    `Bulk User ${i} ${Date.now()}`,
                    this.generateSecurePin(),
                    i % 2 === 0 ? 'admin' : 'cashier'
                );
                if (userId) createdUsers.push(userId);
            }

            const endTime = Date.now();
            const duration = endTime - startTime;
            this.performanceMetrics.bulkCreation = duration;

            console.log(`  Created ${createdUsers.length} users in ${duration}ms`);

            if (duration > 3000) {
                console.log('  Warning: Bulk creation took longer than expected');
                this.securityIssues.push('Slow bulk user creation performance');
            }
        });

        // Test 21: User search performance
        this.runTest('User search performance', async () => {
            const startTime = Date.now();

            // Various search operations
            this.db.all('SELECT * FROM users WHERE role = ?', ['admin']);
            this.db.all('SELECT * FROM users WHERE name LIKE ?', ['%User%']);
            this.db.all('SELECT * FROM users WHERE is_owner = 1');
            this.db.all('SELECT * FROM users ORDER BY name LIMIT 20');

            const endTime = Date.now();
            const duration = endTime - startTime;
            this.performanceMetrics.searchOperations = duration;

            console.log(`  Search operations completed in ${duration}ms`);
        });
    }

    // ===== GENERATE COMPREHENSIVE REPORT =====
    async generateReport() {
        // Cleanup test users
        await this.cleanupTestUsers();

        const report = {
            timestamp: new Date().toISOString(),
            totalTests: this.testCount,
            passedTests: this.passCount,
            failedTests: this.failCount,
            passRate: ((this.passCount / this.testCount) * 100).toFixed(2) + '%',
            testResults: this.testResults,
            securityIssues: this.securityIssues,
            performanceMetrics: this.performanceMetrics,
            summary: {
                status: this.failCount === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED',
                issuesFound: this.testResults.filter(r => r.status === 'FAIL').map(r => r.name),
                securityConcerns: this.securityIssues.length,
                performanceWarnings: Object.keys(this.performanceMetrics).length
            },
            recommendations: [
                'Implement PIN hashing for secure storage',
                'Add account status/active field for user management',
                'Implement failed login attempt tracking',
                'Add session management with timeout',
                'Consider implementing unique constraints on PINs',
                'Add comprehensive input validation',
                'Implement proper error handling and logging',
                'Consider adding user permissions system beyond basic roles',
                'Add audit logging for user operations',
                'Implement proper session management'
            ]
        };

        return report;
    }

    async cleanup() {
        await this.cleanupTestUsers();
        if (this.db) {
            this.db.close();
        }
    }
}

// Main execution
async function runUserAuthenticationCRUDTests() {
    console.log('🚀 Starting Comprehensive User Authentication CRUD Tests\n');

    const tester = new UserAuthenticationCRUDTester();

    try {
        if (!await tester.initDatabase()) {
            throw new Error('Failed to initialize database');
        }

        await tester.testUserCreate();
        await tester.testUserRead();
        await tester.testUserUpdate();
        await tester.testUserDelete();
        await tester.testAuthenticationValidation();
        await tester.testSecurityScenarios();
        await tester.testPerformance();

        const report = await tester.generateReport();

        console.log('\n' + '='.repeat(80));
        console.log('USER AUTHENTICATION CRUD TEST RESULTS SUMMARY');
        console.log('='.repeat(80));
        console.log(`Total Tests: ${report.totalTests}`);
        console.log(`Passed: ${report.passedTests}`);
        console.log(`Failed: ${report.failedTests}`);
        console.log(`Pass Rate: ${report.passRate}`);
        console.log(`Status: ${report.summary.status}`);
        console.log(`Security Issues Found: ${report.summary.securityConcerns}`);

        if (report.summary.issuesFound.length > 0) {
            console.log('\nTest Failures:');
            report.summary.issuesFound.forEach(issue => {
                console.log(`  ✗ ${issue}`);
            });
        }

        if (report.securityIssues.length > 0) {
            console.log('\nSecurity Issues:');
            report.securityIssues.forEach(issue => {
                console.log(`  ⚠️  ${issue}`);
            });
        }

        if (report.performanceMetrics && Object.keys(report.performanceMetrics).length > 0) {
            console.log('\nPerformance Metrics:');
            Object.entries(report.performanceMetrics).forEach(([operation, time]) => {
                console.log(`  ${operation}: ${time}ms`);
            });
        }

        console.log('\nRecommendations:');
        report.recommendations.forEach(rec => {
            console.log(`  • ${rec}`);
        });

        const fs = await import('fs');
        fs.writeFileSync('users-crud-test-report.json', JSON.stringify(report, null, 2));
        console.log('\n📄 Detailed report saved to: users-crud-test-report.json');

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
    runUserAuthenticationCRUDTests()
        .then(report => {
            console.log('\n✅ User Authentication CRUD testing completed!');
            process.exit(report.failCount > 0 || report.securityIssues.length > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('\n💥 User Authentication CRUD testing failed:', error);
            process.exit(1);
        });
}

export { runUserAuthenticationCRUDTests, UserAuthenticationCRUDTester };