PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`price` text NOT NULL,
	`cost` text DEFAULT '0',
	`image` text NOT NULL,
	`stock_quantity` integer NOT NULL,
	`barcode` text,
	`plu` text,
	`category_id` integer,
	`category` text DEFAULT 'General' NOT NULL,
	`weight` real,
	`weight_unit` text,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "name", "price", "cost", "image", "stock_quantity", "barcode", "plu", "category_id", "category", "weight", "weight_unit") SELECT "id", "name", "price", "cost", "image", "stock_quantity", "barcode", "plu", "category_id", "category", NULL, NULL FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `products_barcode_unique` ON `products` (`barcode`);