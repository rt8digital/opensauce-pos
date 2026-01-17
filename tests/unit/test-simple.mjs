import Database from 'better-sqlite3';
import path from 'path';

console.log('Testing database connection...');

try {
    const dbPath = path.join(process.cwd(), 'sqlite.db');
    const db = new Database(dbPath);
    console.log('✓ Database connection established');

    // Test basic user operations
    const users = db.prepare('SELECT * FROM users LIMIT 5').all();
    console.log(`Found ${users.length} users in database`);

    if (users.length > 0) {
        console.log('Sample user:', users[0]);
    }

    // Test creating a user
    const testPin = '123456';
    const result = db.prepare(
        'INSERT INTO users (name, pin, role) VALUES (?, ?, ?)'
    ).run(['Test User', testPin, 'admin']);

    console.log(`Created test user with ID: ${result.lastID}`);

    // Verify the user
    const created = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastID);
    console.log('Created user verification:', created);

    // Clean up
    db.prepare('DELETE FROM users WHERE id = ?').run(result.lastID);
    console.log('Test user cleaned up');

    db.close();
    console.log('✓ Database connection closed');
    console.log('✅ Basic test completed successfully');

} catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
}