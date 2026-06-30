CREATE TABLE `categories` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`name` varchar(80) NOT NULL,
	`kind` enum('post','work','both') NOT NULL DEFAULT 'both',
	`color` varchar(7),
	`summary` varchar(280),
	`sort` smallint NOT NULL DEFAULT 0,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `posts` ADD `category_id` bigint;--> statement-breakpoint
ALTER TABLE `works` ADD `category_id` bigint;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `works` ADD CONSTRAINT `works_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `posts_category_idx` ON `posts` (`category_id`);--> statement-breakpoint
CREATE INDEX `works_category_idx` ON `works` (`category_id`);