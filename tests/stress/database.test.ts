import { test, expect } from '@playwright/test';
import Database from 'better-sqlite3';
// Avoid requiring drizzle-orm in this test environment; use raw sqlite operations

test.describe('Database Stress Tests (Offline/Local)', () => {
    let sqlite: any;

    test.beforeAll(() => {
        // Create an in-memory database for testing using raw sqlite
        sqlite = new Database(':memory:');

        // Setup tables (basic migration for testing)
        sqlite.exec(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price TEXT NOT NULL,
                category TEXT NOT NULL,
                sku TEXT UNIQUE,
                barcode TEXT,
                stock_quantity INTEGER DEFAULT 0,
                image TEXT
            );
        `);

        // Insert test data for read queries
        const insertStmt = sqlite.prepare(`INSERT INTO products (name, price, category, sku, stock_quantity) VALUES (?, ?, ?, ?, ?)`);
        for (let i = 0; i < 200; i++) {
            insertStmt.run(
                `Test Product ${i}`,
                Math.floor(Math.random() * 1000).toString(),
                'Test Category',
                `SKU-${i}`,
                100
            );
        }
    });

    test.afterAll(() => {
        sqlite.close();
    });

    test('should handle bulk inserts efficiently', async () => {
        const count = 1000;
        const startTime = Date.now();

        // Batch insert attempt using prepared statements
        const products = [];
        for (let i = 0; i < count; i++) {
            products.push({
                name: `Stress Product ${i}`,
                price: Math.floor(Math.random() * 1000).toString(),
                category: 'Stress Test',
                sku: `SKU-${Date.now()}-${i}`,
                stock_quantity: 100
            });
        }

        const insertStmt = sqlite.prepare(`INSERT INTO products (name, price, category, sku, stock_quantity) VALUES (?, ?, ?, ?, ?)`);
        const insertMany = sqlite.transaction((rows: any[]) => {
            for (const r of rows) insertStmt.run(r.name, r.price, r.category, r.sku, r.stock_quantity);
        });

        const chunkSize = 50;
        for (let i = 0; i < products.length; i += chunkSize) {
            const chunk = products.slice(i, i + chunkSize);
            insertMany(chunk);
        }

        const endTime = Date.now();
        console.log(`Inserted ${count} records in ${endTime - startTime}ms`);

        const row = sqlite.prepare('SELECT COUNT(*) AS count FROM products').get();
        expect(Number(row.count)).toBeGreaterThan(count); // Should be > 1000 since we inserted test data
        expect(endTime - startTime).toBeLessThan(5000); // Expect < 5s for 1000 records in memory
    });

    test('should handle heavy read queries', async () => {
        const startTime = Date.now();

        // Use raw sqlite queries instead of drizzle
        sqlite.prepare('SELECT * FROM products LIMIT 100').all();
        sqlite.prepare('SELECT * FROM products WHERE CAST(price AS INTEGER) > 500').all();

        const endTime = Date.now();
        expect(endTime - startTime).toBeLessThan(1000);
    });
});
