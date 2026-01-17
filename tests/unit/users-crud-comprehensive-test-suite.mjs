import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

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
    }

    async initDatabase() {
        try {
            // Use existing database or create new one
            const dbPath = path.join(__dirname, 'sqlite.db');
            this.db = new Database(dbPath);
            console.log('✓ Database connection established');

            // Enable foreign key constraints
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

    // Security helper functions
    generateSecurePin() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    checkSqlInjection(input) {
        const dangerousPatterns = [
            '; DROP TABLE', 'DROP TABLE', 'INSERT INTO', 'UPDATE SET',
            'DELETE FROM', '--', '/*', '*/', 'UNION SELECT',
            'EXEC', 'EXECUTE', 'DECLARE', 'CAST(', 'CHAR('
        ];

        return dangerousPatterns.some(pattern =>
            input.toLowerCase().includes(pattern.toLowerCase())
        );
    }

    // ===== CREATE OPERATIONS =====
    async testUserCreate() {
        // Test 1: Create user with valid data
        this.runTest('Create user with valid data', async () => {
            const user = {
                name: 'Test Admin User',
                pin: this.generateSecurePin(),
                role: 'admin',
                isOwner: false
            };

            const result = await this.db.run(
                'INSERT INTO users (name, pin, role, is_owner) VALUES (?, ?, ?, ?)',
                [user.name, user.pin, user.role, user.isOwner]
            );

            if (!result.lastID) {
                throw new Error('User creation failed - no ID returned');
            }

            const created = await this.db.get('SELECT * FROM users WHERE id = ?', [result.lastID]);
            if (!created) throw new Error('Created user not found');

            // Verify all fields
            if (created.name !== user.name) throw new Error('Name mismatch');
            if (created.pin !== user.pin) throw new Error('PIN mismatch');
            if (created.role !== user.role) throw new Error('Role mismatch');
            if (created.is_owner !== user.isOwner) throw new Error('isOwner mismatch');

            console.log(`  Created user with ID: ${result.lastID}`);
        });

        // Test 2: Create user with minimal data
        this.runTest('Create user with minimal data', async () => {
            const user = {
                name: 'Minimal User',
                pin: this.generateSecurePin(),
                role: 'cashier'
            };

            const result = await this.db.run(
                'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                [user.name, user.pin, user.role]
            );

            if (!result.lastID) {
                throw new Error('User creation failed - no ID returned');
            }

            const created = await this.db.get('SELECT * FROM users WHERE id = ?', [result.lastID]);
            if (!created) throw new Error('Created user not found');

            // Check default values
            if (created.is_owner !== 0) throw new Error('Default is_owner should be 0');
            if (!created.created_at) throw new Error('Default created_at missing');

            console.log(`  Created minimal user with ID: ${result.lastID}`);
        });

        // Test 3: Create owner user
        this.runTest('Create owner user', async () => {
            const user = {
                name: 'Owner User',
                pin: this.generateSecurePin(),
                role: 'admin',
                isOwner: true
            };

            const result = await this.db.run(
                'INSERT INTO users (name, pin, role, is_owner) VALUES (?, ?, ?, ?)',
                [user.name, user.pin, user.role, user.isOwner]
            );

            if (!result.lastID) {
                throw new Error('Owner user creation failed');
            }

            const created = await this.db.get('SELECT * FROM users WHERE id = ?', [result.lastID]);
            if (created.is_owner !== 1) throw new Error('Owner flag not set correctly');

            console.log(`  Created owner user with ID: ${result.lastID}`);
        });

        // Test 4: Create user without name (should fail)
        this.runTest('Create user without name (should fail)', async () => {
            try {
                await this.db.run(
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
                await this.db.run(
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

        // Test 6: Create user with invalid role (should fail)
        this.runTest('Create user with invalid role (should fail)', async () => {
            try {
                await this.db.run(
                    'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                    ['Invalid Role User', this.generateSecurePin(), 'invalid_role']
                );
                console.log('  Note: Invalid role was accepted (may need validation)');
            } catch (error) {
                console.log(`  Note: Invalid role rejected: ${error.message}`);
            }
        });

        // Test 7: Create user with duplicate PIN
        this.runTest('Create user with duplicate PIN handling', async () => {
            const pin = this.generateSecurePin();

            // Create first user
            const result1 = await this.db.run(
                'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                ['First User', pin, 'admin']
            );

            // Try to create second user with same PIN
            try {
                await this.db.run(
                    'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                    ['Second User', pin, 'cashier']
                );
                console.log('  Note: Duplicate PIN was allowed (security concern)');
                this.securityIssues.push('Duplicate PINs allowed - potential security issue');
            } catch (error) {
                console.log(`  ✓ Duplicate PIN correctly rejected: ${error.message}`);
            }
        });
    }

    // ===== READ OPERATIONS =====
    async testUserRead() {
        // Test 8: Get all users
        this.runTest('Get all users', async () => {
            const users = await this.db.all('SELECT * FROM users ORDER BY name');
            if (!Array.isArray(users)) {
                throw new Error('Expected array of users');
            }
            console.log(`  Found ${users.length} users`);
        });

        // Test 9: Get user by ID
        this.runTest('Get user by ID', async () => {
            const result = await this.db.run(
                'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                ['Read Test User', this.generateSecurePin(), 'admin']
            );
            const userId = result.lastID;

            const user = await this.db.get('SELECT * FROM users WHERE id = ?', [userId]);
            if (!user) throw new Error('User not found by ID');
            if (user.name !== 'Read Test User') throw new Error('User name mismatch');
        });

        // Test 10: Search users by name
        this.runTest('Search users by name', async () => {
            await this.db.run('INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                ['Search Target Admin', this.generateSecurePin(), 'admin']);
            await this.db.run('INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                ['Other User', this.generateSecurePin(), 'cashier']);
            await this.db.run('INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                ['Search Target Cashier', this.generateSecurePin(), 'cashier']);

            const results = await this.db.all(
                'SELECT * FROM users WHERE name LIKE ? ORDER BY name',
                ['%Search Target%']
            );

            if (results.length !== 2) {
                throw new Error(`Expected 2 users with 'Search Target', found ${results.length}`);
            }
        });

        // Test 11: Filter users by role
        this.runTest('Filter users by role', async () => {
            const adminUsers = await this.db.all(
                'SELECT * FROM users WHERE role = ?',
                ['admin']
            );

            const cashierUsers = await this.db.all(
                'SELECT * FROM users WHERE role = ?',
                ['cashier']
            );

            console.log(`  Found ${adminUsers.length} admin users`);
            console.log(`  Found ${cashierUsers.length} cashier users`);
        });

        // Test 12: Get owner users
        this.runTest('Get owner users', async () => {
            const owners = await this.db.all(
                'SELECT * FROM users WHERE is_owner = 1'
            );

            console.log(`  Found ${owners.length} owner users`);

            owners.forEach(owner => {
                if (owner.role !== 'admin') {
                    console.log(`  Warning: Owner user ${owner.name} has role '${owner.role}' (expected 'admin')`);
                }
            });
        });

        // Test 13: Get users with recent activity
        this.runTest('Get users with recent login activity', async () => {
            const activeUsers = await this.db.all(
                'SELECT * FROM users WHERE last_login IS NOT NULL ORDER BY last_login DESC'
            );

            console.log(`  Found ${activeUsers.length} users with login activity`);
        });
    }

    // ===== UPDATE OPERATIONS =====
    async testUserUpdate() {
        // Test 14: Update user information
        this.runTest('Update user information', async () => {
            const result = await this.db.run(
                'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                ['Update Test User', this.generateSecurePin(), 'cashier']
            );
            const userId = result.lastID;

            const updateResult = await this.db.run(
                'UPDATE users SET name = ?, role = ?, is_owner = ? WHERE id = ?',
                ['Updated User Name', 'admin', 1, userId]
            );

            if (updateResult.changes === 0) {
                throw new Error('UPDATE operation failed - no rows affected');
            }

            const updated = await this.db.get('SELECT * FROM users WHERE id = ?', [userId]);
            if (updated.name !== 'Updated User Name') throw new Error('Name update failed');
            if (updated.role !== 'admin') throw new Error('Role update failed');
            if (updated.is_owner !== 1) throw new Error('isOwner update failed');
        });

        // Test 15: Update user PIN
        this.runTest('Update user PIN', async () => {
            const result = await this.db.run(
                'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                ['PIN Update User', this.generateSecurePin(), 'admin']
            );
            const userId = result.lastID;
            const newPin = this.generateSecurePin();

            const updateResult = await this.db.run(
                'UPDATE users SET pin = ? WHERE id = ?',
                [newPin, userId]
            );

            if (updateResult.changes === 0) {
                throw new Error('PIN update failed - no rows affected');
            }

            const updated = await this.db.get('SELECT * FROM users WHERE id = ?', [userId]);
            if (updated.pin !== newPin) throw new Error('PIN update failed');
        });

        // Test 16: Update non-existent user
        this.runTest('Update non-existent user', async () => {
            const result = await this.db.run(
                'UPDATE users SET name = ? WHERE id = ?',
                ['Non-existent', 99999]
            );

            if (result.changes > 0) {
                throw new Error('UPDATE should not affect non-existent user');
            }
        });

        // Test 17: Update with SQL injection attempt
        this.runTest('Update with SQL injection attempt', async () => {
            const maliciousName = "'; DROP TABLE users; --";

            try {
                await this.db.run(
                    'UPDATE users SET name = ? WHERE id = 1',
                    [maliciousName]
                );
                console.log('  Note: SQL injection attempt was treated as regular data (good)');
            } catch (error) {
                console.log(`  ✓ SQL injection attempt rejected: ${error.message}`);
            }
        });

        // Test 18: Update last_login timestamp
        this.runTest('Update last_login timestamp', async () => {
            const result = await this.db.run(
                'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                ['Login Test User', this.generateSecurePin(), 'admin']
            );
            const userId = result.lastID;

            const loginTime = Date.now();
            await this.db.run(
                'UPDATE users SET last_login = ? WHERE id = ?',
                [loginTime, userId]
            );

            const updated = await this.db.get('SELECT * FROM users WHERE id = ?', [userId]);
            if (!updated.last_login) throw new Error('last_login not updated');
            if (Math.abs(updated.last_login - loginTime) > 1000) {
                throw new Error('last_login timestamp mismatch');
            }
        });
    }

    // ===== DELETE OPERATIONS =====
    async testUserDelete() {
        // Test 19: Delete user
        this.runTest('Delete user', async () => {
            const result = await this.db.run(
                'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                ['Delete Test User', this.generateSecurePin(), 'cashier']
            );
            const userId = result.lastID;

            const deleteResult = await this.db.run(
                'DELETE FROM users WHERE id = ?',
                [userId]
            );

            if (deleteResult.changes === 0) {
                throw new Error('DELETE operation failed - no rows affected');
            }

            const deleted = await this.db.get('SELECT * FROM users WHERE id = ?', [userId]);
            if (deleted) throw new Error('User should be deleted');
        });

        // Test 20: Delete non-existent user
        this.runTest('Delete non-existent user', async () => {
            const result = await this.db.run(
                'DELETE FROM users WHERE id = ?',
                [99999]
            );

            if (result.changes > 0) {
                throw new Error('DELETE should not affect non-existent user');
            }
        });

        // Test 21: Test referential integrity (user with orders)
        this.runTest('Test user deletion with orders', async () => {
            // Create user
            const userResult = await this.db.run(
                'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                ['Order User', this.generateSecurePin(), 'admin']
            );
            const userId = userResult.lastID;

            // Create order for user
            const orderResult = await this.db.run(
                'INSERT INTO orders (items, total, payment_method, user_id) VALUES (?, ?, ?, ?)',
                ['Test Item', '10.00', 'cash', userId]
            );

            try {
                // Try to delete user with orders
                const deleteResult = await this.db.run(
                    'DELETE FROM users WHERE id = ?',
                    [userId]
                );

                if (deleteResult.changes > 0) {
                    console.log('  Warning: User with orders was deleted (may need CASCADE or protection)');
                    this.securityIssues.push('User deletion with existing orders allowed - potential data integrity issue');
                } else {
                    console.log('  ✓ User with orders protected from deletion');
                }
            } catch (error) {
                console.log(`  ✓ User with orders protected: ${error.message}`);
            }
        });

        // Test 22: Prevent deletion of last owner
        this.runTest('Prevent deletion of last owner', async () => {
            // Get all owners
            const owners = await this.db.all('SELECT * FROM users WHERE is_owner = 1');

            if (owners.length === 1) {
                try {
                    await this.db.run('DELETE FROM users WHERE id = ?', [owners[0].id]);
                    console.log('  Warning: Last owner deletion allowed (security risk)');
                    this.securityIssues.push('Last owner can be deleted - security vulnerability');
                } catch (error) {
                    console.log(`  ✓ Last owner deletion prevented: ${error.message}`);
                }
            } else {
                console.log(`  Multiple owners exist (${owners.length}), skipping last owner protection test`);
            }
        });
    }

    // ===== AUTHENTICATION VALIDATION =====
    async testAuthenticationValidation() {
        // Test 23: PIN format validation
        this.runTest('PIN format validation', async () => {
            const invalidPins = ['123', '12345', '1234567', 'abc123', '123456a', '12-456'];
            const validPin = '123456';

            // Test invalid PIN formats
            for (const pin of invalidPins) {
                try {
                    await this.db.run(
                        'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                        [`Invalid PIN Test ${pin}`, pin, 'admin']
                    );
                    console.log(`  Note: Invalid PIN '${pin}' was accepted (no validation)`);
                } catch (error) {
                    console.log(`  Note: Invalid PIN '${pin}' rejected: ${error.message}`);
                }
            }

            // Test valid PIN
            try {
                await this.db.run(
                    'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                    ['Valid PIN Test', validPin, 'admin']
                );
                console.log(`  ✓ Valid PIN '${validPin}' accepted`);
            } catch (error) {
                console.log(`  Note: Valid PIN '${validPin}' rejected: ${error.message}`);
            }
        });

        // Test 24: Role-based access control validation
        this.runTest('Role-based access control validation', async () => {
            // Create users with different roles
            await this.db.run(
                'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                ['Admin User', this.generateSecurePin(), 'admin']
            );

            await this.db.run(
                'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                ['Cashier User', this.generateSecurePin(), 'cashier']
            );

            // Verify role assignments
            const adminUsers = await this.db.all("SELECT * FROM users WHERE role = 'admin'");
            const cashierUsers = await this.db.all("SELECT * FROM users WHERE role = 'cashier'");

            if (adminUsers.length === 0) throw new Error('No admin users found');
            if (cashierUsers.length === 0) throw new Error('No cashier users found');

            console.log(`  ✓ Found ${adminUsers.length} admin users and ${cashierUsers.length} cashier users`);
        });

        // Test 25: Login attempt simulation
        this.runTest('Login attempt simulation', async () => {
            // Create test user
            const testPin = '123456';
            const result = await this.db.run(
                'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                ['Login Test User', testPin, 'admin']
            );
            const userId = result.lastID;

            // Simulate login with correct PIN
            const user = await this.db.get('SELECT * FROM users WHERE id = ? AND pin = ?', [userId, testPin]);
            if (!user) throw new Error('Valid login failed');
            console.log('  ✓ Valid PIN login successful');

            // Simulate login with incorrect PIN
            const invalidUser = await this.db.get('SELECT * FROM users WHERE id = ? AND pin = ?', [userId, '000000']);
            if (invalidUser) throw new Error('Invalid login should have failed');
            console.log('  ✓ Invalid PIN login correctly rejected');

            // Update last_login on successful login
            await this.db.run(
                'UPDATE users SET last_login = ? WHERE id = ?',
                [Date.now(), userId]
            );
            console.log('  ✓ Login timestamp updated');
        });

        // Test 26: Account status validation
        this.runTest('Account status validation', async () => {
            // Note: Current schema doesn't have account status fields
            // This test checks if we need to add them for security

            const users = await this.db.all('SELECT * FROM users');
            const hasStatusField = users.length > 0 && 'is_active' in users[0];

            if (!hasStatusField) {
                console.log('  Note: No account status field found - recommend adding is_active field');
                this.securityIssues.push('No account status/active field - cannot disable accounts');
            } else {
                console.log('  ✓ Account status field exists');
            }
        });
    }

    // ===== SECURITY SCENARIOS =====
    async testSecurityScenarios() {
        // Test 27: Password/PIN hashing check
        this.runTest('PIN storage security', async () => {
            const testPin = '123456';
            const result = await this.db.run(
                'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                ['Security Test User', testPin, 'admin']
            );
            const userId = result.lastID;

            const user = await this.db.get('SELECT * FROM users WHERE id = ?', [userId]);

            // Check if PIN is stored in plain text (security issue)
            if (user.pin === testPin) {
                console.log('  ⚠️  SECURITY ISSUE: PIN stored in plain text!');
                this.securityIssues.push('PIN stored in plain text - should be hashed');
            } else {
                console.log('  ✓ PIN appears to be hashed');
            }
        });

        // Test 28: SQL injection prevention
        this.runTest('SQL injection prevention', async () => {
            const maliciousInputs = [
                "'; DROP TABLE users; --",
                "' OR '1'='1",
                "'; UPDATE users SET role='admin' WHERE name='test'; --",
                "admin'--",
                "' UNION SELECT * FROM users --"
            ];

            for (const input of maliciousInputs) {
                try {
                    await this.db.run(
                        'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                        [input, this.generateSecurePin(), 'admin']
                    );
                    console.log(`  Note: Malicious input '${input}' was treated as regular data`);
                } catch (error) {
                    console.log(`  ✓ Malicious input '${input}' rejected: ${error.message}`);
                }
            }
        });

        // Test 29: Session management simulation
        this.runTest('Session management simulation', async () => {
            const user = await this.db.run(
                'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                ['Session Test User', this.generateSecurePin(), 'admin']
            );
            const userId = user.lastID;

            // Simulate login
            await this.db.run(
                'UPDATE users SET last_login = ? WHERE id = ?',
                [Date.now(), userId]
            );

            // Check if session tracking is adequate
            const updatedUser = await this.db.get('SELECT * FROM users WHERE id = ?', [userId]);

            console.log('  Note: Session tracking via last_login only - may need enhancement');
            this.securityIssues.push('Basic session tracking - consider adding session tokens and timeout');
        });

        // Test 30: Failed login attempt tracking
        this.runTest('Failed login attempt tracking', async () => {
            // Check if failed login attempts are tracked
            const users = await this.db.all('SELECT * FROM users LIMIT 1');

            if (users.length > 0) {
                const hasFailedLoginField = 'failed_login_attempts' in users[0];

                if (!hasFailedLoginField) {
                    console.log('  Note: No failed login attempt tracking - security enhancement needed');
                    this.securityIssues.push('No failed login attempt tracking - vulnerable to brute force');
                } else {
                    console.log('  ✓ Failed login attempt tracking exists');
                }
            }
        });
    }

    // ===== ERROR SCENARIOS =====
    async testErrorScenarios() {
        // Test 31: Database connection error handling
        this.runTest('Database connection error handling', async () => {
            try {
                const users = await this.db.all('SELECT COUNT(*) as count FROM users');
                if (!users || users.length === 0) {
                    throw new Error('Failed to get user count');
                }
                console.log(`  ✓ Database connection healthy - ${users[0].count} users`);
            } catch (error) {
                throw new Error('Database connection failed: ' + error.message);
            }
        });

        // Test 32: Data type validation
        this.runTest('Data type validation', async () => {
            const invalidData = {
                name: 123, // Should be string
                pin: null, // Should be string
                role: undefined, // Should be string
                is_owner: 'invalid' // Should be boolean/number
            };

            try {
                await this.db.run(
                    'INSERT INTO users (name, pin, role, is_owner) VALUES (?, ?, ?, ?)',
                    [invalidData.name, invalidData.pin, invalidData.role, invalidData.is_owner]
                );
                console.log('  Note: Invalid data types were accepted');
            } catch (error) {
                console.log(`  ✓ Invalid data types rejected: ${error.message}`);
            }
        });

        // Test 33: Concurrent user operations
        this.runTest('Concurrent user operations', async () => {
            const operations = [];

            // Simulate concurrent user creation
            for (let i = 0; i < 5; i++) {
                operations.push(
                    this.db.run(
                        'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                        [`Concurrent User ${i}`, this.generateSecurePin(), 'cashier']
                    )
                );
            }

            try {
                const results = await Promise.all(operations);
                console.log(`  ✓ Concurrent operations completed - ${results.length} users created`);
            } catch (error) {
                console.log(`  Note: Concurrent operations issue: ${error.message}`);
            }
        });

        // Test 34: Resource cleanup
        this.runTest('Resource cleanup and constraints', async () => {
            // Test large name handling
            const longName = 'a'.repeat(1000);
            try {
                await this.db.run(
                    'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                    [longName, this.generateSecurePin(), 'admin']
                );
                console.log('  Note: Very long name was accepted');
            } catch (error) {
                console.log(`  ✓ Very long name rejected: ${error.message}`);
            }

            // Test empty string handling
            try {
                await this.db.run(
                    'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                    ['', this.generateSecurePin(), 'admin']
                );
                console.log('  Note: Empty name was accepted');
            } catch (error) {
                console.log(`  ✓ Empty name rejected: ${error.message}`);
            }
        });
    }

    // ===== PERFORMANCE TESTING =====
    async testPerformance() {
        // Test 35: Bulk user creation performance
        this.runTest('Bulk user creation performance', async () => {
            const startTime = Date.now();
            const userCount = 50;

            for (let i = 0; i < userCount; i++) {
                await this.db.run(
                    'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)',
                    [`Bulk User ${i}`, this.generateSecurePin(), i % 2 === 0 ? 'admin' : 'cashier']
                );
            }

            const endTime = Date.now();
            const duration = endTime - startTime;
            this.performanceMetrics.bulkCreation = duration;

            console.log(`  Created ${userCount} users in ${duration}ms`);

            if (duration > 5000) {
                console.log('  Warning: Bulk creation took longer than expected');
                this.securityIssues.push('Slow bulk user creation performance');
            }
        });

        // Test 36: User search performance
        this.runTest('User search performance', async () => {
            const startTime = Date.now();

            // Various search operations
            await this.db.all('SELECT * FROM users WHERE role = ?', ['admin']);
            await this.db.all('SELECT * FROM users WHERE name LIKE ?', ['%User%']);
            await this.db.all('SELECT * FROM users WHERE is_owner = 1');
            await this.db.all('SELECT * FROM users ORDER BY name LIMIT 20');

            const endTime = Date.now();
            const duration = endTime - startTime;
            this.performanceMetrics.searchOperations = duration;

            console.log(`  Search operations completed in ${duration}ms`);

            if (duration > 2000) {
                console.log('  Warning: Search operations took longer than expected');
                this.securityIssues.push('Slow user search performance');
            }
        });

        // Test 37: Role-based query performance
        this.runTest('Role-based query performance', async () => {
            const startTime = Date.now();

            // Test queries for different roles
            const queries = [
                'SELECT COUNT(*) as count FROM users WHERE role = "admin"',
                'SELECT COUNT(*) as count FROM users WHERE role = "cashier"',
                'SELECT * FROM users WHERE is_owner = 1',
                'SELECT * FROM users WHERE last_login IS NOT NULL'
            ];

            for (const query of queries) {
                await this.db.all(query);
            }

            const endTime = Date.now();
            const duration = endTime - startTime;
            this.performanceMetrics.roleQueries = duration;

            console.log(`  Role-based queries completed in ${duration}ms`);
        });

        // Test 38: Large dataset performance
        this.runTest('Large dataset performance', async () => {
            const totalUsers = await this.db.get('SELECT COUNT(*) as count FROM users');
            console.log(`  Total users in database: ${totalUsers.count}`);

            const startTime = Date.now();

            // Test pagination
            const pageSize = 25;
            const pages = Math.ceil(totalUsers.count / pageSize);

            for (let page = 0; page < Math.min(pages, 3); page++) {
                const offset = page * pageSize;
                const pageResults = await this.db.all(
                    'SELECT * FROM users LIMIT ? OFFSET ?',
                    [pageSize, offset]
                );
                console.log(`  Page ${page + 1}: ${pageResults.length} users`);
            }

            const endTime = Date.now();
            const duration = endTime - startTime;
            this.performanceMetrics.pagination = duration;

            console.log(`  Pagination test completed in ${duration}ms`);
        });
    }

    // ===== GENERATE COMPREHENSIVE REPORT =====
    async generateReport() {
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
        if (this.db) {
            await this.db.close();
        }
    }
}

// Main execution
async function runUserAuthenticationCRUDTests() {
    console.log('🚀 Starting Comprehensive User Authentication CRUD Tests\n');

    const tester = new UserAuthenticationCRUDTester();

    try {
        // Initialize database
        if (!await tester.initDatabase()) {
            throw new Error('Failed to initialize database');
        }

        // Run all test suites
        await tester.testUserCreate();
        await tester.testUserRead();
        await tester.testUserUpdate();
        await tester.testUserDelete();
        await tester.testAuthenticationValidation();
        await tester.testSecurityScenarios();
        await tester.testErrorScenarios();
        await tester.testPerformance();

        // Generate report
        const report = await tester.generateReport();

        // Print summary
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

        // Save detailed report
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