CREATE TABLE `cash_outs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` integer NOT NULL,
	`opening_cash` text DEFAULT '0',
	`cash_received` text NOT NULL,
	`change_given` text NOT NULL,
	`expected_cash` text NOT NULL,
	`actual_cash` text,
	`discrepancy` text,
	`notes` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`preference_key` text NOT NULL,
	`preference_value` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `order_items` ADD `original_price` text;--> statement-breakpoint
ALTER TABLE `order_items` ADD `discounted_price` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `receipt_continuous_printing` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `settings` ADD `receipt_prevent_scaling` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `settings` ADD `receipt_max_lines_per_page` integer DEFAULT 50;--> statement-breakpoint
-- ALTER TABLE `settings` ADD `vat_percentage` real;--> statement-breakpoint
-- ALTER TABLE `settings` ADD `vat_number` text;--> statement-breakpoint
-- ALTER TABLE `settings` ADD `advice_list` text DEFAULT '[]' NOT NULL;