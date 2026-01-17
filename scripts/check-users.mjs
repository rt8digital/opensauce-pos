import Database from 'better-sqlite3';

const sqlite = new Database('./sqlite.db');

// Check if users table exists and has any records
try {
    const usersTable = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users';").get();
    if (usersTable) {
        const userCount = sqlite.prepare('SELECT COUNT(*) as count FROM users;').get();
        console.log('Users table exists with', userCount.count, 'records');
        
        if (userCount.count === 0) {
            console.log('No users exist - setup is needed');
        } else {
            console.log('Users exist - setup not needed');
        }
    } else {
        console.log('Users table does not exist');
    }
} catch (e) {
    console.log('Error checking users table:', e.message);
}

sqlite.close();