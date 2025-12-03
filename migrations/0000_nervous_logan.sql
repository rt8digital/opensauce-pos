CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`loyalty_points` integer DEFAULT 0,
	`total_spent` text DEFAULT '0',
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `discounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`value` text NOT NULL,
	`active` integer DEFAULT true
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`price` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer,
	`user_id` integer,
	`items` text NOT NULL,
	`total` text NOT NULL,
	`payment_method` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`price` text NOT NULL,
	`image` text NOT NULL,
	`stock_quantity` integer NOT NULL,
	`barcode` text NOT NULL,
	`plu` text,
	`category` text DEFAULT 'General' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_barcode_unique` ON `products` (`barcode`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`store_name` text DEFAULT 'OpenSauce P.O.S.' NOT NULL,
	`store_address` text,
	`store_phone` text,
	`store_email` text,
	`store_logo` text,
	`currency` text DEFAULT 'R' NOT NULL,
	`printer_name` text,
	`printer_ip` text,
	`scanner_device_id` text,
	`scanner_com_port` text,
	`camera_device_id` text,
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
	`payment_qr_code` text,
	`theme` text DEFAULT 'light' NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_text` text NOT NULL,
	`language` text NOT NULL,
	`translated_text` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`pin` text NOT NULL,
	`role` text NOT NULL,
	`is_owner` integer DEFAULT false,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`last_login` integer
);
