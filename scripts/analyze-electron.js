import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from 'electron';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runAnalysis() {
    const reportPath = path.join(process.cwd(), 'db-final-check.txt');
    const log = (msg) => {
        console.log(msg);
        fs.appendFileSync(reportPath, msg + '\n');
    };

    if (fs.existsSync(reportPath)) fs.unlinkSync(reportPath);

    const dbPath = path.join(process.cwd(), 'sqlite.db');

    try {
        const db = new Database(dbPath);

        log('--- Final Database Audit ---');

        // Price/Stock issues
        const missingPrice = db.prepare("SELECT COUNT(*) as count FROM products WHERE price IS NULL OR price = '' OR price = '0'").get().count;
        log(`- Products with zero or missing price: ${missingPrice}`);

        const outOfStock = db.prepare("SELECT COUNT(*) as count FROM products WHERE stock_quantity <= 0").get().count;
        log(`- Products with zero or negative stock: ${outOfStock}`);

        // Category cleanup
        log('\n--- Category Analysis ---');
        const categories = db.prepare('SELECT * FROM categories').all();
        log(`Existing Categories in table: ${categories.map(c => `${c.name} (ID: ${c.id})`).join(', ')}`);

        const stringCats = db.prepare('SELECT DISTINCT category FROM products').all();
        log(`Category strings in products: ${stringCats.map(c => c.category).join(', ')}`);

        // Orders performance / size
        const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
        log(`\n- Total Orders: ${totalOrders}`);

        const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
        log(`- Total Customers: ${totalCustomers}`);

        // Check for orders with status other than completed
        const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get().count;
        log(`- Pending Orders: ${pendingOrders}`);

        const cancelledOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'cancelled'").get().count;
        log(`- Cancelled Orders: ${cancelledOrders}`);

        db.close();
    } catch (error) {
        log('Error: ' + error.message);
    } finally {
        app.quit();
    }
}

app.whenReady().then(runAnalysis);
