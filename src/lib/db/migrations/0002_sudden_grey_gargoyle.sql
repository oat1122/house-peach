ALTER TABLE `work_images` MODIFY COLUMN `kind` enum('before','after','process','detail','plan') NOT NULL DEFAULT 'after';--> statement-breakpoint
ALTER TABLE `works` ADD `duration_days` int;--> statement-breakpoint
ALTER TABLE `works` ADD `client_quote` mediumtext;--> statement-breakpoint
ALTER TABLE `works` ADD `client_name` varchar(80);--> statement-breakpoint
ALTER TABLE `works` ADD `designer_note` mediumtext;--> statement-breakpoint
ALTER TABLE `works` ADD `materials` json;