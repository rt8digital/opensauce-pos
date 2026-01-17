ALTER TABLE `settings` ADD `cameraScannerEnabled` integer DEFAULT true;
--> statement-breakpoint
ALTER TABLE `settings` ADD `cameraFacing` text DEFAULT 'back';
--> statement-breakpoint
ALTER TABLE `settings` ADD `cameraResolution` text DEFAULT 'auto';
--> statement-breakpoint
ALTER TABLE `settings` ADD `cameraTorchEnabled` integer DEFAULT false;
--> statement-breakpoint
ALTER TABLE `settings` ADD `cameraContinuousScan` integer DEFAULT false;
--> statement-breakpoint
ALTER TABLE `settings` ADD `cameraSupportedFormats` text DEFAULT 'qr_code,code_128,code_39,ean_13,ean_8,upc_a,upc_e';
