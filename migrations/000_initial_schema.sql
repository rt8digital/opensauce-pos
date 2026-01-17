-- Initial schema for OpenSauce POS
-- This creates all essential tables in the correct order to avoid foreign key constraints

-- Users table (referenced by multiple other tables)
CREATE TABLE IF NOT EXISTS `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`pin` text NOT NULL,
	`role` text NOT NULL,
	`is_owner` integer DEFAULT false,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`last_login` integer
);

-- Categories table (referenced by products)
CREATE TABLE IF NOT EXISTS `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL UNIQUE,
	`description` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);

-- Customers table (referenced by orders)
CREATE TABLE IF NOT EXISTS `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`loyalty_points` integer DEFAULT 0,
	`total_spent` text DEFAULT '0',
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);

-- Products table (referenced by order_items)
CREATE TABLE IF NOT EXISTS `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`price` text NOT NULL,
	`cost` text DEFAULT '0',
	`image` text NOT NULL,
	`stock_quantity` integer NOT NULL,
	`barcode` text UNIQUE,
	`plu` text,
	`category_id` integer REFERENCES categories(id),
	`category` text DEFAULT 'General' NOT NULL,
	`weight` real,
	`weight_unit` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);

-- Orders table (references users and customers)
CREATE TABLE IF NOT EXISTS `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer REFERENCES customers(id),
	`user_id` integer REFERENCES users(id),
	`items` text NOT NULL,
	`total` text NOT NULL,
	`payment_method` text NOT NULL,
	`source` text DEFAULT 'pos' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`cash_received` text,
	`change` text,
	`discount` text DEFAULT '0'
);

-- Order items table
CREATE TABLE IF NOT EXISTS `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`price` text NOT NULL,
	`original_price` text,
	`discounted_price` text,
	`voided` integer DEFAULT false
);

-- Discounts table
CREATE TABLE IF NOT EXISTS `discounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`value` text NOT NULL,
	`active` integer DEFAULT true
);

-- Settings table
CREATE TABLE IF NOT EXISTS `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`store_name` text DEFAULT 'OpenSauce P.O.S.' NOT NULL,
	`store_address` text,
	`store_phone` text,
	`store_email` text,
	`store_logo` text,
	`currency` text DEFAULT 'R' NOT NULL,
	`printer_name` text,
	`printer_type` text DEFAULT 'usb',
	`printer_ip` text,
	`printer_device_id` text,
	`scanner_device_id` text,
	`scanner_com_port` text,
	`camera_device_id` text,
	`cameraScannerEnabled` integer DEFAULT true,
	`cameraFacing` text DEFAULT 'back',
	`cameraResolution` text DEFAULT 'auto',
	`cameraTorchEnabled` integer DEFAULT false,
	`cameraContinuousScan` integer DEFAULT false,
	`cameraSupportedFormats` text DEFAULT 'qr_code,code_128,code_39,ean_13,ean_8,upc_a,upc_e',
	`cash_drawer_port` text,
	`customer_display_type` text,
	`customer_display_value` text,
	`scale_port` text,
	`scale_device_id` text,
	`receipt_width` text DEFAULT '80mm',
	`receipt_custom_width` integer,
	`receipt_header_text` text,
	`receipt_footer_text` text,
	`receipt_font_size` text DEFAULT 'medium',
	`receipt_show_logo` integer DEFAULT true,
	`receipt_show_order_number` integer DEFAULT true,
	`receipt_show_date` integer DEFAULT true,
	`receipt_show_customer` integer DEFAULT true,
	`receipt_show_payment_method` integer DEFAULT true,
	`receipt_show_barcode` integer DEFAULT false,
	`receipt_logo_size` integer DEFAULT 100,
	`qr_code_scale` integer DEFAULT 100,
	`receipt_continuous_printing` integer DEFAULT false,
	`receipt_prevent_scaling` integer DEFAULT false,
	`receipt_max_lines_per_page` integer DEFAULT 50,
	`receipt_show_qr_code` integer DEFAULT false,
	`payment_qr_code` text,
	`whatsapp_enabled` integer DEFAULT false,
	`whatsapp_phone_number` text,
	`whatsapp_api_key` text,
	`whatsapp_business_id` text,
	`whatsapp_send_receipts` integer DEFAULT false,
	`theme` text DEFAULT 'light' NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`device_role` text DEFAULT 'standalone',
	`server_ip_address` text,
	`autoBackupEnabled` integer DEFAULT false,
	`backupFrequency` text DEFAULT 'daily',
	`backupLocation` text,
	`sessionTimeout` integer DEFAULT 30,
	`passwordMinLength` integer DEFAULT 6,
	`passwordRequireSpecial` integer DEFAULT false,
	`lowStockThreshold` integer DEFAULT 10,
	`stockAlertEnabled` integer DEFAULT true,
	`auditLoggingEnabled` integer DEFAULT true,
	`auditLogLevel` text DEFAULT 'info',
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`vat_percentage` real,
	`vat_number` text,
	`advice_list` text DEFAULT '[]' NOT NULL
);

-- Translations table
CREATE TABLE IF NOT EXISTS `translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_text` text NOT NULL,
	`language` text NOT NULL,
	`translated_text` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);

-- Bot settings table
CREATE TABLE IF NOT EXISTS `bot_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`welcome_message` text DEFAULT 'Welcome to our store! How can I help you today?',
	`help_message` text DEFAULT 'Available commands: menu, order [item], help',
	`unknown_command_message` text DEFAULT 'Sorry, I didn''t understand that command. Type "help" for available commands.',
	`order_confirmation_message` text DEFAULT 'Your order has been placed successfully!',
	`is_enabled` integer DEFAULT false,
	`business_name` text,
	`business_phone` text,
	`auto_reply` integer DEFAULT true,
	`queue_orders` integer DEFAULT true,
	`max_concurrent_chats` integer DEFAULT 10,
	`response_delay` integer DEFAULT 1
);

-- WhatsApp queue table
CREATE TABLE IF NOT EXISTS `whatsapp_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`phone_number` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`sent_at` integer,
	`attempts` integer DEFAULT 0,
	`max_attempts` integer DEFAULT 3
);

-- WhatsApp consent table
CREATE TABLE IF NOT EXISTS `whatsapp_consent` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`phone_number` text NOT NULL UNIQUE,
	`consent_status` text NOT NULL,
	`consent_given_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`consent_revoked_at` integer,
	`consent_source` text DEFAULT 'whatsapp_bot' NOT NULL,
	`notes` text
);

-- Cash outs table
CREATE TABLE IF NOT EXISTS `cash_outs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL REFERENCES users(id),
	`date` integer NOT NULL,
	`opening_cash` text DEFAULT '0',
	`cash_received` text NOT NULL,
	`change_given` text NOT NULL,
	`expected_cash` text NOT NULL,
	`actual_cash` text,
	`discrepancy` text,
	`notes` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);

-- User preferences table
CREATE TABLE IF NOT EXISTS `user_preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL REFERENCES users(id),
	`preference_key` text NOT NULL,
	`preference_value` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL REFERENCES users(id),
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer NOT NULL,
	`old_value` text,
	`new_value` text,
	`reason` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);

-- Insert default settings
INSERT OR IGNORE INTO settings (
	store_name, currency, receipt_width, receipt_font_size,
	receipt_show_logo, receipt_show_order_number, receipt_show_date,
	receipt_show_customer, receipt_show_payment_method, receipt_show_barcode,
	theme, language, device_role, sessionTimeout, passwordMinLength,
	lowStockThreshold, stockAlertEnabled, auditLoggingEnabled, auditLogLevel
) VALUES (
	'OpenSauce P.O.S.', 'R', '80mm', 'medium',
	1, 1, 1,
	1, 1, 0,
	'light', 'en', 'standalone', 30, 6,
	10, 1, 1, 'info'
);

-- Insert default admin user (PIN: 123456)
INSERT OR IGNORE INTO users (name, pin, role, is_owner) 
VALUES ('Admin', '123456', 'admin', 1);

-- Insert default category
INSERT OR IGNORE INTO categories (name, description) 
VALUES ('General', 'Default category for all products');