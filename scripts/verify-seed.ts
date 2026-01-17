
import Database from 'better-sqlite3';
import { initializeDefaultSchema } from '../electron/db-init';
import fs from 'fs';
import path from 'path';

const TEST_DB = 'test-seed.db';

if (fs.existsSync(TEST_DB)) {
    fs.unlinkSync(TEST_DB);
}

const db = new Database(TEST_DB);

try {
    console.log('Initializing schema...');
    initializeDefaultSchema(db);

    console.log('Verifying Users...');
    const users = db.prepare('SELECT * FROM users').all();
    console.log('Users found:', users.length);
    users.forEach((u: any) => console.log(`- ${u.name} (${u.role}): PIN=${u.pin}`));

    const admin = users.find((u: any) => u.name === 'Admin') as any;
    const cashier = users.find((u: any) => u.name === 'Cashier') as any;

    if (!admin || admin.pin !== '888888') throw new Error('Admin not seeded correctly');
    if (!cashier || cashier.pin !== '654321') throw new Error('Cashier not seeded correctly');

    console.log('Verifying Products...');
    const products = db.prepare('SELECT * FROM products').all();
    console.log('Products found:', products.length);
    if (products.length < 10) throw new Error('Not enough products seeded');
    products.forEach((p: any) => console.log(`- ${p.name}: ${p.price}`));

    console.log('SUCCESS: Database seeding verification passed.');

} catch (error) {
    console.error('FAILED:', error);
    process.exit(1);
} finally {
    db.close();
    if (fs.existsSync(TEST_DB)) {
        fs.unlinkSync(TEST_DB);
    }
}
