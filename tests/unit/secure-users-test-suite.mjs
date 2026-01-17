
import Database from 'better-sqlite3';
import crypto from 'crypto';

// Enhanced User Authentication CRUD Test Suite with Security
class SecureUserAuthenticationTester {
    constructor() {
        this.db = new Database('sqlite.db');
        this.securityIssues = [];
    }

    hashPin(pin, salt = null) {
        const pinSalt = salt || crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(pin, pinSalt, 10000, 64, 'sha512').toString('hex');
        return { hash, salt: pinSalt };
    }

    verifyPin(pin, hash, salt) {
        const { hash: testHash } = this.hashPin(pin, salt);
        return testHash === hash;
    }

    async testSecureUserCreation() {
        console.log('Testing secure user creation...');
        
        const pin = '123456';
        const { hash, salt } = this.hashPin(pin);
        
        const result = this.db.prepare(
            'INSERT INTO users (name, pin_hash, pin_salt, role) VALUES (?, ?, ?, ?)'
        ).run(`Secure User ${Date.now()}`, hash, salt, 'admin');
        
        if (!result.lastInsertRowid) {
            throw new Error('Failed to create secure user');
        }
        
        // Verify PIN is not stored in plain text
        const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
        if (user.pin === pin) {
            throw new Error('PIN stored in plain text - security issue!');
        }
        if (!user.pin_hash || !user.pin_salt) {
            throw new Error('PIN hash or salt missing');
        }
        
        // Test PIN verification
        const validLogin = this.verifyPin(pin, user.pin_hash, user.pin_salt);
        if (!validLogin) {
            throw new Error('PIN verification failed');
        }
        
        console.log('✓ Secure user creation successful');
        
        // Cleanup
        this.db.prepare('DELETE FROM users WHERE id = ?').run(result.lastInsertRowid);
    }
}

// Export for use in main test suite
export { SecureUserAuthenticationTester };
