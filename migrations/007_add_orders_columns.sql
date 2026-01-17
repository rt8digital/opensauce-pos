-- Add missing columns to orders table
ALTER TABLE `orders` ADD COLUMN `source` text DEFAULT 'pos';
ALTER TABLE `orders` ADD COLUMN `status` text DEFAULT 'completed';
ALTER TABLE `orders` ADD COLUMN `notes` text;
ALTER TABLE `orders` ADD COLUMN `cash_received` text;
ALTER TABLE `orders` ADD COLUMN `change` text;
