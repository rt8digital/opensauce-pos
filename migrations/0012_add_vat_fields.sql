ALTER TABLE `settings` ADD `vat_percentage` real;--> statement-breakpoint
ALTER TABLE `settings` ADD `vat_number` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `advice_list` text DEFAULT '[]' NOT NULL;