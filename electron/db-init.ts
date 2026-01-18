import Database from 'better-sqlite3';


/**
 * Initialize a fresh database with default schema
 * This function creates all necessary tables for a new installation
 */
export function initializeDefaultSchema(db: Database.Database): void {
    // Enable foreign key constraints
    db.pragma('foreign_keys = ON');

    console.log('Starting initializeDefaultSchema...');

    // 1. Create all tables if they do not exist
    console.log('Creating tables if they do not exist...');

    // Core Identity & Auth
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

    // Settings & Configuration
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
            printer_type text DEFAULT 'usb',
            printer_ip text,
            printer_device_id text,
            printer_codepage text DEFAULT 'cp437',
            printer_model text,
            printer_manufacturer text,
            scanner_device_id text,
            scanner_com_port text,
            scanner_type text DEFAULT 'usb',
            camera_device_id text,
            camera_scanner_enabled integer DEFAULT 0,
            camera_facing text DEFAULT 'environment',
            camera_resolution text DEFAULT '1280x720',
            camera_torch_enabled integer DEFAULT 0,
            camera_continuous_scan integer DEFAULT 0,
            camera_supported_formats text DEFAULT '["code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "qr_code", "pdf_417", "data_matrix", "code_93", "codabar", "itf"]',
            cash_drawer_port text,
            cash_drawer_pulse integer DEFAULT 100,
            customer_display_type text,
            customer_display_value text,
            enable_customer_display integer DEFAULT 0,
            enable_bluetooth_peripherals integer DEFAULT 0,
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
            receipt_show_qr_code integer DEFAULT 0,
            qr_code_scale integer DEFAULT 100,
            receipt_logo_scale integer DEFAULT 100,
            payment_qr_code text,
            theme text DEFAULT 'light' NOT NULL,
            language text DEFAULT 'en' NOT NULL,
            device_role text DEFAULT 'standalone',
            server_ip_address text,
            auto_backup_enabled integer DEFAULT 0,
            backup_frequency text DEFAULT 'daily',
            backup_location text,
            session_timeout integer DEFAULT 30,
            password_min_length integer DEFAULT 4,
            password_require_special integer DEFAULT 0,
            low_stock_threshold integer DEFAULT 10,
            stock_alert_enabled integer DEFAULT 1,
            audit_logging_enabled integer DEFAULT 1,
            audit_log_level text DEFAULT 'info',
            tax_rate real DEFAULT 0,
            vat_percentage real DEFAULT 0,
            vat_number text,
            advice_list text DEFAULT '[]',
            auto_launch_enabled integer DEFAULT 0,
            
            -- WhatsApp
            whatsapp_enabled integer DEFAULT 0,
            whatsapp_phone_number text,
            whatsapp_api_key text,
            whatsapp_business_id text,
            whatsapp_send_receipts integer DEFAULT 0,

            -- Robust Receipt Customization
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
            receipt_divider_opacity integer DEFAULT 20,
            receipt_show_item_divider integer DEFAULT 1,
            receipt_item_divider_style text DEFAULT 'dashed',
            receipt_show_total_divider integer DEFAULT 1,
            receipt_compact_mode integer DEFAULT 0,

            updated_at integer DEFAULT (strftime('%s', 'now')) NOT NULL
        )
    `);

    // CRM & Inventory
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

    db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            name text NOT NULL UNIQUE,
            description text,
            created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL
        )
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS products (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            name text NOT NULL,
            price text NOT NULL,
            cost text DEFAULT '0',
            image text NOT NULL,
            stock_quantity integer NOT NULL,
            barcode text UNIQUE,
            plu text,
            category_id integer,
            category text DEFAULT 'General' NOT NULL,
            weight real,
            weight_unit text,
            created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    `);

    // Transactions
    db.exec(`
        CREATE TABLE IF NOT EXISTS discounts (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            name text NOT NULL,
            type text NOT NULL,
            value text NOT NULL,
            active integer DEFAULT 1
        )
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS orders (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            customer_id integer,
            user_id integer,
            items text NOT NULL,
            total text NOT NULL,
            discount_amount text DEFAULT '0',
            payment_method text NOT NULL,
            source text DEFAULT 'pos' NOT NULL,
            status text DEFAULT 'pending' NOT NULL,
            notes text,
            cash_received text,
            change text,
            discount text DEFAULT '0',
            created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON UPDATE NO ACTION ON DELETE NO ACTION,
            FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE NO ACTION
        )
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS order_items (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            order_id integer NOT NULL,
            product_id integer NOT NULL,
            quantity integer NOT NULL,
            price text NOT NULL,
            original_price text,
            discounted_price text,
            voided integer DEFAULT 0,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON UPDATE NO ACTION ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE NO ACTION ON DELETE NO ACTION
        )
    `);

    // Operations & Logs
    db.exec(`
        CREATE TABLE IF NOT EXISTS cash_outs (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            user_id integer NOT NULL,
            date integer NOT NULL,
            opening_cash text DEFAULT '0',
            cash_received text NOT NULL,
            change_given text NOT NULL,
            expected_cash text NOT NULL,
            actual_cash text,
            discrepancy text,
            notes text,
            created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

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
            ip_address text,
            user_agent text,
            created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Additional Support Tables (New)
    db.exec(`
        CREATE TABLE IF NOT EXISTS translations (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            source_text text NOT NULL,
            language text NOT NULL,
            translated_text text NOT NULL,
            created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL
        )
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS bot_settings (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            welcome_message text DEFAULT 'Welcome to our store! How can I help you today?',
            help_message text DEFAULT 'Available commands: menu, order [item], help',
            unknown_command_message text DEFAULT 'Sorry, I didn''t understand that command. Type "help" for available commands.',
            order_confirmation_message text DEFAULT 'Your order has been placed successfully!',
            is_enabled integer DEFAULT 0,
            business_name text,
            business_phone text,
            auto_reply integer DEFAULT 1,
            queue_orders integer DEFAULT 1,
            max_concurrent_chats integer DEFAULT 10,
            response_delay integer DEFAULT 1
        )
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS whatsapp_queue (
            id text PRIMARY KEY NOT NULL,
            phone_number text NOT NULL,
            message text NOT NULL,
            status text DEFAULT 'pending' NOT NULL,
            created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
            sent_at integer,
            attempts integer DEFAULT 0,
            max_attempts integer DEFAULT 3
        )
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS whatsapp_consent (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            phone_number text NOT NULL UNIQUE,
            consent_status text NOT NULL,
            consent_given_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
            consent_revoked_at integer,
            consent_source text DEFAULT 'whatsapp_bot' NOT NULL,
            notes text
        )
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS user_preferences (
            id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            user_id integer NOT NULL,
            preference_key text NOT NULL,
            preference_value text,
            created_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
            updated_at integer DEFAULT (strftime('%s', 'now')) NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // 2. CRITICAL: Migrations for existing databases - Run BEFORE indexes
    console.log('Running column migrations for existing databases...');
    const tablesToCheck = ['orders', 'products', 'order_items', 'settings'];
    for (const table of tablesToCheck) {
        const columns = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
        const columnNames = columns.map(c => c.name);

        if (table === 'orders') {
            if (!columnNames.includes('status')) db.exec("ALTER TABLE orders ADD COLUMN status text DEFAULT 'pending' NOT NULL");
            if (!columnNames.includes('source')) db.exec("ALTER TABLE orders ADD COLUMN source text DEFAULT 'pos' NOT NULL");
            if (!columnNames.includes('cash_received')) db.exec("ALTER TABLE orders ADD COLUMN cash_received text");
            if (!columnNames.includes('change')) db.exec("ALTER TABLE orders ADD COLUMN change text");
            if (!columnNames.includes('discount')) db.exec("ALTER TABLE orders ADD COLUMN discount text DEFAULT '0'");
        }
        if (table === 'products') {
            if (!columnNames.includes('cost')) db.exec("ALTER TABLE products ADD COLUMN cost text DEFAULT '0'");
            if (!columnNames.includes('category_id')) db.exec("ALTER TABLE products ADD COLUMN category_id integer");
            if (!columnNames.includes('weight')) db.exec("ALTER TABLE products ADD COLUMN weight real");
            if (!columnNames.includes('weight_unit')) db.exec("ALTER TABLE products ADD COLUMN weight_unit text");
        }
        if (table === 'order_items') {
            if (!columnNames.includes('voided')) db.exec("ALTER TABLE order_items ADD COLUMN voided integer DEFAULT 0");
            if (!columnNames.includes('original_price')) db.exec("ALTER TABLE order_items ADD COLUMN original_price text");
            if (!columnNames.includes('discounted_price')) db.exec("ALTER TABLE order_items ADD COLUMN discounted_price text");
        }
        if (table === 'settings') {
            if (!columnNames.includes('advice_list')) db.exec("ALTER TABLE settings ADD COLUMN advice_list text DEFAULT '[]'");
            if (!columnNames.includes('auto_launch_enabled')) db.exec("ALTER TABLE settings ADD COLUMN auto_launch_enabled integer DEFAULT 0");
            if (!columnNames.includes('printer_codepage')) db.exec("ALTER TABLE settings ADD COLUMN printer_codepage text DEFAULT 'cp437'");
            if (!columnNames.includes('printer_model')) db.exec("ALTER TABLE settings ADD COLUMN printer_model text");
            if (!columnNames.includes('printer_manufacturer')) db.exec("ALTER TABLE settings ADD COLUMN printer_manufacturer text");
            if (!columnNames.includes('receipt_show_qr_code')) db.exec("ALTER TABLE settings ADD COLUMN receipt_show_qr_code integer DEFAULT 0");
        }
    }

    // 3. Create indexes for performance
    console.log('Creating indexes...');
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
        CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
        CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
        CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
        CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
        CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
        CREATE INDEX IF NOT EXISTS idx_cash_outs_user_id ON cash_outs(user_id);
        CREATE INDEX IF NOT EXISTS idx_translations_source_text ON translations(source_text);
    `);

    // 4. Default Data Initialization
    console.log('Checking for existing users...');
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (userCount.count === 0) {
        console.log('Inserting default users...');
        const insertUser = db.prepare('INSERT INTO users (name, pin, role, is_owner) VALUES (?, ?, ?, ?)');
        insertUser.run('Admin', '888888', 'admin', 1);
        insertUser.run('Cashier', '654321', 'cashier', 0);
        console.log('Default users created (Admin PIN: 888888, Cashier PIN: 654321)');
    }

    console.log('Checking for existing products...');
    const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
    if (productCount.count === 0) {
        console.log('Seeding sample products...');
        const insertProduct = db.prepare(`
            INSERT INTO products (name, price, image, stock_quantity, barcode, category, cost) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const sampleProducts = [
            ['Beef Burger', '85.00', '', 100, '001', 'Food', '45.00'],
            ['Cheese Burger', '95.00', '', 100, '002', 'Food', '50.00'],
            ['Chicken Burger', '75.00', '', 100, '003', 'Food', '40.00'],
            ['Large Fries', '35.00', '', 200, '004', 'Sides', '10.00'],
            ['Regular Fries', '25.00', '', 200, '005', 'Sides', '7.00'],
            ['Coca Cola', '25.00', '', 500, '006', 'Beverages', '12.00'],
            ['Still Water', '15.00', '', 500, '007', 'Beverages', '5.00'],
            ['Cappuccino', '35.00', '', 150, '008', 'Cafe', '10.00'],
            ['Greek Salad', '65.00', '', 50, '009', 'Salads', '30.00'],
            ['Chocolate Muffin', '28.00', '', 80, '010', 'Bakery', '12.00']
        ];

        for (const product of sampleProducts) {
            insertProduct.run(...product);
        }
        console.log('Sample products seeded');
    }

    const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
    if (settingsCount.count === 0) {
        db.prepare(`INSERT INTO settings (id) VALUES (1)`).run();
    }

    console.log('Database schema initialized successfully');
}
