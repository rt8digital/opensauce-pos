CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);
--> statement-breakpoint
ALTER TABLE `products` ADD `cost` text DEFAULT '0';
--> statement-breakpoint
ALTER TABLE `products` ADD `category_id` integer REFERENCES categories(id);