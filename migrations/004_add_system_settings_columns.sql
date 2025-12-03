ALTER TABLE `settings` ADD `autoBackupEnabled` integer DEFAULT false;
--> statement-breakpoint
ALTER TABLE `settings` ADD `backupFrequency` text DEFAULT 'daily';
--> statement-breakpoint
ALTER TABLE `settings` ADD `backupLocation` text;
--> statement-breakpoint
ALTER TABLE `settings` ADD `sessionTimeout` integer DEFAULT 30;
--> statement-breakpoint
ALTER TABLE `settings` ADD `passwordMinLength` integer DEFAULT 6;
--> statement-breakpoint
ALTER TABLE `settings` ADD `passwordRequireSpecial` integer DEFAULT false;
--> statement-breakpoint
ALTER TABLE `settings` ADD `lowStockThreshold` integer DEFAULT 10;
--> statement-breakpoint
ALTER TABLE `settings` ADD `stockAlertEnabled` integer DEFAULT true;
--> statement-breakpoint
ALTER TABLE `settings` ADD `auditLoggingEnabled` integer DEFAULT true;
--> statement-breakpoint
ALTER TABLE `settings` ADD `auditLogLevel` text DEFAULT 'info';
