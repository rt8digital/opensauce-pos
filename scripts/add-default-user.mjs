import Database from 'better-sqlite3';

const sqlite = new Database('./sqlite.db');

try {
    // Check if any users already exist
    const userCount = sqlite.prepare('SELECT COUNT(*) as count FROM users;').get();

    if (userCount.count === 0) {
        console.log('No users exist, creating default accounts...');

        // Insert default users with correct PINs
        const stmt = sqlite.prepare(`
            INSERT INTO users (name, pin, role, is_owner)
            VALUES (?, ?, ?, ?)
        `);

        // Admin account (PIN: 888888)
        const adminInfo = stmt.run('Admin', '888888', 'admin', 1);
        console.log('Admin account created with ID:', adminInfo.lastInsertRowid);
        console.log('  Name: Admin | PIN: 888888 | Role: admin');

        // Cashier account (PIN: 654321)
        const cashierInfo = stmt.run('Cashier', '654321', 'cashier', 0);
        console.log('Cashier account created with ID:', cashierInfo.lastInsertRowid);
        console.log('  Name: Cashier | PIN: 654321 | Role: cashier');
    } else {
        console.log('Users already exist, skipping default user creation');
        const users = sqlite.prepare('SELECT id, name, role, is_owner FROM users;').all();
        console.log('Existing users:', users);
    }
} catch (error) {
    console.error('Error creating default user:', error);
}

sqlite.close();