import Database from 'better-sqlite3';
import { readFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

// Handle Electron environment or Node environment
const isElectron = process.versions.electron !== undefined;

console.log('Generating database...');

// Ensure database directory exists if we are in a specific environment?
// For now, consistent with apply-migrations.mjs which uses ./sqlite.db in cwd.

const dbPath = './sqlite.db';
const sqlite = new Database(dbPath);

try {
    // Ensure migrations table exists
    sqlite.exec(`
        CREATE TABLE IF NOT EXISTS __drizzle_migrations (
            id TEXT PRIMARY KEY,
            hash text NOT NULL,
            created_at numeric
        )
    `);

    // Read all migration files
    const migrationsDir = './migrations';
    if (!existsSync(migrationsDir)) {
        console.error('Migrations directory not found:', migrationsDir);
        process.exit(1);
    }

    const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    console.log('Found migration files:', files);

    for (const file of files) {
        // Check if migration already applied
        const existing = sqlite.prepare('SELECT id FROM __drizzle_migrations WHERE id = ?').get(file.replace('.sql', ''));
        if (existing) {
            console.log(`Skipping applied migration: ${file}`);
            continue;
        }

        console.log('Applying migration:', file);
        const migrationSql = readFileSync(resolve(migrationsDir, file), 'utf8');

        // Split by statement-breakpoint and execute each statement
        const statements = migrationSql.split('--> statement-breakpoint');

        sqlite.transaction(() => {
            for (const statement of statements) {
                const trimmed = statement.trim();
                if (trimmed) {
                    try {
                        sqlite.exec(trimmed);
                    } catch (e) {
                        // Ignore "table already exists" errors if we are re-running for safety,
                        // but ideally we should rely on the migration table check above.
                        // However, for the very first migration (tables creation), better to be safe.
                        if (!e.message.includes('already exists')) {
                            throw e;
                        }
                    }
                }
            }

            // Record this migration as completed
            sqlite.prepare('INSERT INTO __drizzle_migrations (id, hash, created_at) VALUES (?, ?, ?)').run(
                file.replace('.sql', ''),
                'manual-' + Date.now(),
                Date.now()
            );
        })();

        console.log('  Migration recorded');
    }

    console.log('All migrations applied');

    // Check tables after migration
    const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name != '__drizzle_migrations';").all();
    console.log('Tables in database:', tables.map(t => t.name));

    // Seed Data
    console.log('Seeding database with test data...');

    // 1. Seed Users
    const usersCount = sqlite.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (usersCount === 0) {
        console.log('Seeding users...');
        const insertUser = sqlite.prepare('INSERT INTO users (name, pin, role, is_owner, created_at) VALUES (?, ?, ?, ?, ?)');
        insertUser.run('Admin', '888888', 'admin', 1, Date.now());
        insertUser.run('Cashier', '654321', 'cashier', 0, Date.now());
        console.log('  Added 2 users (Admin PIN: 888888, Cashier PIN: 654321)');
    } else {
        console.log('  Users already exist, skipping seed');
    }

    // 2. Seed Categories
    const categoriesCount = sqlite.prepare('SELECT COUNT(*) as count FROM categories').get().count;
    let drinksCategoryId;
    let snacksCategoryId;

    if (categoriesCount === 0) {
        console.log('Seeding categories...');
        const insertCategory = sqlite.prepare('INSERT INTO categories (name, description, created_at) VALUES (?, ?, ?)');
        const cat1 = insertCategory.run('Drinks', 'Beverages and Refreshments', Date.now());
        const cat2 = insertCategory.run('Snacks', 'Packaged snacks and chips', Date.now());
        drinksCategoryId = cat1.lastInsertRowid;
        snacksCategoryId = cat2.lastInsertRowid;
        console.log('  Added 2 categories');
    } else {
        console.log('  Categories already exist, attempting to fetch IDs for product seeding');
        const drinks = sqlite.prepare("SELECT id FROM categories WHERE name = 'Drinks'").get();
        const snacks = sqlite.prepare("SELECT id FROM categories WHERE name = 'Snacks'").get();
        // If they exist use them, otherwise we might have mixed state, but for now this is fine
        drinksCategoryId = drinks ? drinks.id : null;
        snacksCategoryId = snacks ? snacks.id : null;
    }

    // 3. Seed Products
    const productsCount = sqlite.prepare('SELECT COUNT(*) as count FROM products').get().count;
    if (productsCount === 0 && drinksCategoryId && snacksCategoryId) {
        console.log('Seeding products...');
        const insertProduct = sqlite.prepare(`
            INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category, category_id, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        // Helper to generate a dummy base64 image or placeholder URL
        // Using a simple placeholder text for now as the app likely checks for string presence
        const placeholderImg = '';

        insertProduct.run('Coke 330ml', '15.00', '8.50', placeholderImg, 50, '5449000000996', 'Drinks', drinksCategoryId, Date.now());
        insertProduct.run('Fanta Orange 330ml', '15.00', '8.50', placeholderImg, 45, '5449000014528', 'Drinks', drinksCategoryId, Date.now());
        insertProduct.run('Lays Salted 125g', '18.00', '11.00', placeholderImg, 30, '60096173', 'Snacks', snacksCategoryId, Date.now());
        console.log('  Added 3 products');
    } else {
        console.log('  Products already exist or categories missing, skipping seed');
    }

    // 4. Seed Customers
    const customersCount = sqlite.prepare('SELECT COUNT(*) as count FROM customers').get().count;
    let customerId;
    if (customersCount === 0) {
        console.log('Seeding customers...');
        const insertCustomer = sqlite.prepare('INSERT INTO customers (name, email, phone, loyalty_points, total_spent, created_at) VALUES (?, ?, ?, ?, ?, ?)');
        const cust = insertCustomer.run('John Doe', 'john@example.com', '0821234567', 10, '150.00', Date.now());
        customerId = cust.lastInsertRowid;
        console.log('  Added 1 customer');
    } else {
        console.log('  Customers already exist, fetch one for orders');
        const existing = sqlite.prepare('SELECT id FROM customers LIMIT 1').get();
        customerId = existing ? existing.id : null;
    }

    // 5. Seed Orders (Sales)
    const ordersCount = sqlite.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    if (ordersCount === 0 && customerId) {
        console.log('Seeding orders...');
        const insertOrder = sqlite.prepare(`
            INSERT INTO orders (customer_id, user_id, items, total, payment_method, source, status, created_at, cash_received, change) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        // Needs a user ID, assume 1 (admin) from above exists or was created
        const userId = 1;

        // Mock items JSON
        const itemsJson = JSON.stringify([
            { id: 1, name: 'Coke 330ml', price: 15.00, quantity: 2, subtotal: 30.00 }
        ]);

        insertOrder.run(customerId, userId, itemsJson, '30.00', 'cash', 'pos', 'completed', Date.now(), '50.00', '20.00');
        console.log('  Added 1 test order');
    } else {
        console.log('  Orders already exist or dependencies missing, skipping seed');
    }

    sqlite.close();

    console.log('Database generation completed successfully.');
    if (isElectron) {
        process.exit(0);
    }

} catch (error) {
    console.error('Error generating database:', error);
    if (error.stack) {
        console.error('Stack trace:', error.stack);
    }
    sqlite.close();
    process.exit(1);
}
