import Database from 'better-sqlite3';

console.log('Seeding database...');

const dbPath = './sqlite.db';
const sqlite = new Database(dbPath);

try {
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

        const userId = 1;
        const itemsJson = JSON.stringify([
            { id: 1, name: 'Coke 330ml', price: 15.00, quantity: 2, subtotal: 30.00 }
        ]);

        insertOrder.run(customerId, userId, itemsJson, '30.00', 'cash', 'pos', 'completed', Date.now(), '50.00', '20.00');
        console.log('  Added 1 test order');
    } else {
        console.log('  Orders already exist or dependencies missing, skipping seed');
    }

    sqlite.close();
    console.log('Database seeded successfully');

    if (process.versions.electron) {
        process.exit(0);
    }

} catch (error) {
    console.error('Error seeding database:', error);
    if (error.stack) {
        console.error('Stack trace:', error.stack);
    }
    sqlite.close();
    process.exit(1);
}
