import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from 'electron';
import fs from 'fs';

async function checkStock() {
    const logPath = path.join(process.cwd(), 'stock-check.txt');
    const log = (msg) => { console.log(msg); fs.appendFileSync(logPath, msg + '\n'); };
    if (fs.existsSync(logPath)) fs.unlinkSync(logPath);

    const dbPath = path.join(process.cwd(), 'sqlite.db');
    const db = new Database(dbPath);

    try {
        log('--- Inventory Stock Audit ---');

        // 1. Check for literal zero or negative stock
        const zeroStock = db.prepare('SELECT id, name, stock_quantity FROM products WHERE stock_quantity <= 0').all();
        log(`Products with 0 or less stock count: ${zeroStock.length}`);
        zeroStock.slice(0, 10).forEach(p => log(`- ${p.name}: ${p.stock_quantity}`));

        // 2. Check for Low Stock Threshold in settings
        const settings = db.prepare('SELECT lowStockThreshold, stockAlertEnabled FROM settings LIMIT 1').get();
        log(`\nSettings:`);
        log(`- Low Stock Threshold: ${settings?.lowStockThreshold}`);
        log(`- Stock Alert Enabled: ${settings?.stockAlertEnabled}`);

        // 3. Check for products BELOW the threshold (but above 0)
        if (settings?.lowStockThreshold) {
            const lowStock = db.prepare('SELECT id, name, stock_quantity FROM products WHERE stock_quantity > 0 AND stock_quantity <= ?').all(settings.lowStockThreshold);
            log(`\nProducts below low stock threshold (${settings.lowStockThreshold}): ${lowStock.length}`);
            lowStock.slice(0, 10).forEach(p => log(`- ${p.name}: ${p.stock_quantity}`));
        }

        // 4. Sample check of a few items to see their raw data
        log('\n--- Sample Products Data ---');
        const samples = db.prepare('SELECT id, name, stock_quantity, price FROM products LIMIT 5').all();
        samples.forEach(s => log(JSON.stringify(s)));

        db.close();
    } catch (error) {
        log('Error: ' + error.message);
    } finally {
        app.quit();
    }
}

app.whenReady().then(checkStock);
