ALTER TABLE `settings` ADD `printer_type` text DEFAULT 'usb';
--> statement-breakpoint
ALTER TABLE `settings` ADD `whatsapp_enabled` integer DEFAULT false;
--> statement-breakpoint
ALTER TABLE `settings` ADD `whatsapp_phone_number` text;
--> statement-breakpoint
ALTER TABLE `settings` ADD `whatsapp_api_key` text;
--> statement-breakpoint
ALTER TABLE `settings` ADD `whatsapp_business_id` text;
--> statement-breakpoint
ALTER TABLE `settings` ADD `whatsapp_send_receipts` integer DEFAULT false;
