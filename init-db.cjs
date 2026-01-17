const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('Initializing database...');

// Create database in project root
const dbPath = path.join(__dirname, 'sqlite.db');

// Remove existing database if it exists
if (fs.existsSync(dbPath)) {
    console.log('Removing existing database...');
    fs.unlinkSync(dbPath);
}

console.log('Creating new database at:', dbPath);
const db = new Database(dbPath);

// Enable WAL mode
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('Creating tables...');

// Users table
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        name text NOT NULL,
        pin text NOT NULL,
        role text NOT NULL,
        is_owner integer DEFAULT 0,
        created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
        last_login integer
    )
`);

// Settings table
db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        store_name text DEFAULT 'OpenSauce P.O.S.' NOT NULL,
        store_address text,
        store_phone text,
        store_email text,
        store_logo text,
        currency text DEFAULT 'R' NOT NULL,
        printer_name text,
        printer_ip text,
        scanner_device_id text,
        scanner_com_port text,
        camera_device_id text,
        cash_drawer_port text,
        customer_display_type text,
        customer_display_value text,
        scale_port text,
        scale_device_id text,
        receipt_width text DEFAULT '80mm',
        receipt_custom_width integer,
        receipt_header_text text,
        receipt_footer_text text,
        receipt_font_size text DEFAULT 'medium',
        receipt_show_logo integer DEFAULT 1,
        receipt_show_order_number integer DEFAULT 1,
        receipt_show_date integer DEFAULT 1,
        receipt_show_customer integer DEFAULT 1,
        receipt_show_payment_method integer DEFAULT 1,
        receipt_show_barcode integer DEFAULT 0,
        payment_qr_code text,
        theme text DEFAULT 'light' NOT NULL,
        language text DEFAULT 'en' NOT NULL,
        updated_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
        receipt_show_qr_code integer DEFAULT 0,
        advice_list text DEFAULT '[]',
        auto_launch_enabled integer DEFAULT 0,
        receipt_header_font text DEFAULT 'standard',
        receipt_header_scale integer DEFAULT 100,
        receipt_items_font text DEFAULT 'standard',
        receipt_items_scale integer DEFAULT 100,
        receipt_numbers_font text DEFAULT 'mono',
        receipt_numbers_scale integer DEFAULT 100,
        receipt_details_font text DEFAULT 'mono',
        receipt_details_scale integer DEFAULT 90,
        receipt_metadata_font text DEFAULT 'standard',
        receipt_metadata_scale integer DEFAULT 80,
        receipt_logo_scale integer DEFAULT 100,
        receipt_divider_opacity integer DEFAULT 20,
        receipt_show_item_divider integer DEFAULT 1,
        receipt_item_divider_style text DEFAULT 'dashed',
        receipt_show_total_divider integer DEFAULT 1,
        receipt_compact_mode integer DEFAULT 0
    )
`);

// Customers table
db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        name text NOT NULL,
        email text,
        phone text,
        loyalty_points integer DEFAULT 0,
        total_spent text DEFAULT '0',
        created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL
    )
`);

// Categories table
db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        name text NOT NULL,
        description text,
        created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL
    )
`);

// Products table
db.exec(`
    CREATE TABLE IF NOT EXISTS products (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        name text NOT NULL,
        price text NOT NULL,
        cost text,
        image text,
        stock_quantity integer NOT NULL,
        barcode text,
        plu text,
        category text DEFAULT 'General' NOT NULL,
        category_id integer,
        created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE NO ACTION ON DELETE SET NULL
    )
`);

// Discounts table
db.exec(`
    CREATE TABLE IF NOT EXISTS discounts (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        name text NOT NULL,
        type text NOT NULL,
        value text NOT NULL,
        active integer DEFAULT 1
    )
`);

// Orders table
db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        customer_id integer,
        user_id integer,
        items text NOT NULL,
        total text NOT NULL,
        discount text DEFAULT '0',
        payment_method text,
        source text DEFAULT 'pos',
        status text DEFAULT 'completed',
        notes text,
        cash_received text,
        change text,
        created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
        FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE NO ACTION
    )
`);

// Order items table
db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        order_id integer NOT NULL,
        product_id integer NOT NULL,
        quantity integer NOT NULL,
        price text NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON UPDATE NO ACTION ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE NO ACTION ON DELETE NO ACTION
    )
`);

// Translations table
db.exec(`
    CREATE TABLE IF NOT EXISTS translations (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        source_text text NOT NULL,
        language text NOT NULL,
        translated_text text NOT NULL,
        created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL
    )
`);

// Audit logs table
db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id integer NOT NULL,
        action text NOT NULL,
        entity_type text NOT NULL,
        entity_id integer NOT NULL,
        old_value text,
        new_value text,
        reason text,
        created_at text NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE NO ACTION
    )
`);

// Migrations table
db.exec(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id TEXT PRIMARY KEY,
        hash text NOT NULL,
        created_at numeric
    )
`);

console.log('Seeding default data...');

// Insert default users
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (userCount === 0) {
    const insertUser = db.prepare('INSERT INTO users (name, pin, role, is_owner) VALUES (?, ?, ?, ?)');

    // Admin account (password: 888888)
    insertUser.run('Admin', '888888', 'admin', 1);

    // Cashier account (password: 654321)
    insertUser.run('Cashier', '654321', 'cashier', 0);

    console.log('✓ Default users created (Admin: 888888, Cashier: 654321)');
}

// Insert default settings
const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get().count;
if (settingsCount === 0) {
    db.prepare('INSERT INTO settings DEFAULT VALUES').run();
    console.log('✓ Default settings created');
}

// Insert sample categories
const categoriesCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
if (categoriesCount === 0) {
    const insertCategory = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');

    insertCategory.run('Food', 'Food items');
    insertCategory.run('Beverages', 'Drinks and beverages');
    insertCategory.run('Sides', 'Side dishes');
    insertCategory.run('Cafe', 'Coffee and tea');
    insertCategory.run('Salads', 'Fresh salads');
    insertCategory.run('Bakery', 'Baked goods');

    console.log('✓ Sample categories created');
}

// Insert sample products
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
if (productCount === 0) {
    const insertProduct = db.prepare(`
        INSERT INTO products (name, price, cost, image, stock_quantity, barcode, category, category_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Get category IDs
    const foodCat = db.prepare("SELECT id FROM categories WHERE name = 'Food'").get().id;
    const beverageCat = db.prepare("SELECT id FROM categories WHERE name = 'Beverages'").get().id;
    const sidesCat = db.prepare("SELECT id FROM categories WHERE name = 'Sides'").get().id;
    const cafeCat = db.prepare("SELECT id FROM categories WHERE name = 'Cafe'").get().id;
    const saladsCat = db.prepare("SELECT id FROM categories WHERE name = 'Salads'").get().id;
    const bakeryCat = db.prepare("SELECT id FROM categories WHERE name = 'Bakery'").get().id;

    // Sample inventory items
    const sampleProducts = [
        ['Beef Burger', '85.00', '45.00', '', 100, '001', 'Food', foodCat],
        ['Cheese Burger', '95.00', '50.00', '', 100, '002', 'Food', foodCat],
        ['Chicken Burger', '75.00', '40.00', '', 100, '003', 'Food', foodCat],
        ['Large Fries', '35.00', '10.00', '', 200, '004', 'Sides', sidesCat],
        ['Regular Fries', '25.00', '7.00', '', 200, '005', 'Sides', sidesCat],
        ['Coca Cola', '25.00', '12.00', '', 500, '006', 'Beverages', beverageCat],
        ['Still Water', '15.00', '5.00', '', 500, '007', 'Beverages', beverageCat],
        ['Cappuccino', '35.00', '10.00', '', 150, '008', 'Cafe', cafeCat],
        ['Greek Salad', '65.00', '30.00', '', 50, '009', 'Salads', saladsCat],
        ['Chocolate Muffin', '28.00', '12.00', '', 80, '010', 'Bakery', bakeryCat],
        ['Veggie Burger', '70.00', '35.00', '', 80, '011', 'Food', foodCat],
        ['Iced Coffee', '30.00', '12.00', '', 200, '012', 'Cafe', cafeCat],
        ['Orange Juice', '28.00', '15.00', '', 150, '013', 'Beverages', beverageCat],
        ['Caesar Salad', '60.00', '28.00', '', 40, '014', 'Salads', saladsCat],
        ['Blueberry Muffin', '28.00', '12.00', '', 70, '015', 'Bakery', bakeryCat]
    ];

    for (const product of sampleProducts) {
        insertProduct.run(...product);
    }

    console.log('✓ Sample products created (15 items)');
}

db.close();

console.log('\n✅ Database initialized successfully at:', dbPath);
console.log('\nYou can now run: npm run dev:electron');
process.exit(0);
