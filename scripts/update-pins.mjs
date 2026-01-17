import Database from 'better-sqlite3';

console.log('Updating PINs...');

const dbPath = './sqlite.db';
const sqlite = new Database(dbPath);

try {
    const update = sqlite.prepare('UPDATE users SET pin = ? WHERE role = ?');

    const adminResult = update.run('888888', 'admin');
    console.log(`Updated Admin PIN to 888888: ${adminResult.changes} changes`);

    const cashierResult = update.run('654321', 'cashier');
    console.log(`Updated Cashier PIN to 654321: ${cashierResult.changes} changes`);

    sqlite.close();
    console.log('PIN update complete');

    if (process.versions.electron) {
        process.exit(0);
    }

} catch (error) {
    console.error('Error updating PINs:', error);
    process.exit(1);
}
