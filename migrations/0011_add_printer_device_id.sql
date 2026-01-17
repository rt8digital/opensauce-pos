PRAGMA foreign_keys=OFF;--> statement-breakpoint
ALTER TABLE `settings` ADD COLUMN `printer_device_id` text;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint