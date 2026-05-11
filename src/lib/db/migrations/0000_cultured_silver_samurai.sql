CREATE TABLE `contact_inquiries` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`contact_name` varchar(120) NOT NULL,
	`contact_email` varchar(255) NOT NULL,
	`contact_phone` varchar(40),
	`service_type` enum('full_design','consultation','partial','other') NOT NULL,
	`budget_range` enum('under_100k','100k_300k','300k_700k','700k_1.5m','1.5m_plus'),
	`project_description` varchar(2000) NOT NULL,
	`status` enum('new','contacted','closed') NOT NULL DEFAULT 'new',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(255),
	`email` varchar(255) NOT NULL,
	`email_verified` timestamp,
	`image` varchar(500),
	`role` enum('admin','editor') NOT NULL DEFAULT 'editor',
	`password_hash` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_idx` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`name` varchar(80) NOT NULL,
	`kind` enum('post','work','both') NOT NULL DEFAULT 'both',
	`sort` smallint NOT NULL DEFAULT 0,
	CONSTRAINT `tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `tags_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`title` varchar(180) NOT NULL DEFAULT '',
	`alt` varchar(255) NOT NULL DEFAULT '',
	`path` varchar(500) NOT NULL,
	`mime` varchar(64) NOT NULL,
	`width` int NOT NULL DEFAULT 0,
	`height` int NOT NULL DEFAULT 0,
	`bytes` int NOT NULL DEFAULT 0,
	`created_by_id` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_assets_uuid_idx` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `media_pairs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`before_asset_id` bigint NOT NULL,
	`after_asset_id` bigint NOT NULL,
	`label` varchar(180) NOT NULL DEFAULT '',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_pairs_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_pairs_assets_idx` UNIQUE(`before_asset_id`,`after_asset_id`)
);
--> statement-breakpoint
CREATE TABLE `post_images` (
	`post_id` bigint NOT NULL,
	`media_asset_id` bigint NOT NULL,
	`sort` smallint NOT NULL DEFAULT 0,
	CONSTRAINT `post_images_pk` UNIQUE(`post_id`,`media_asset_id`)
);
--> statement-breakpoint
CREATE TABLE `post_tags` (
	`post_id` bigint NOT NULL,
	`tag_id` bigint NOT NULL,
	CONSTRAINT `post_tags_pk` UNIQUE(`post_id`,`tag_id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`slug` varchar(140) NOT NULL,
	`title` varchar(180) NOT NULL,
	`excerpt` varchar(280) NOT NULL,
	`body_mdx` mediumtext NOT NULL,
	`cover_media_asset_id` bigint,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`published_at` timestamp,
	`author_id` bigint NOT NULL,
	`reading_time_min` smallint,
	`view_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `posts_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `work_images` (
	`work_id` bigint NOT NULL,
	`media_asset_id` bigint NOT NULL,
	`kind` enum('before','after','process','detail') NOT NULL DEFAULT 'after',
	`pair_id` bigint,
	`caption` varchar(280),
	`sort` smallint NOT NULL DEFAULT 0,
	CONSTRAINT `work_images_pk` UNIQUE(`work_id`,`media_asset_id`)
);
--> statement-breakpoint
CREATE TABLE `work_tags` (
	`work_id` bigint NOT NULL,
	`tag_id` bigint NOT NULL,
	CONSTRAINT `work_tags_pk` UNIQUE(`work_id`,`tag_id`)
);
--> statement-breakpoint
CREATE TABLE `works` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`slug` varchar(140) NOT NULL,
	`title` varchar(180) NOT NULL,
	`summary` varchar(280) NOT NULL,
	`body_mdx` mediumtext NOT NULL,
	`room_type` enum('living','bedroom','kitchen','bathroom','office','outdoor','full_house','other') NOT NULL,
	`style` varchar(60) NOT NULL,
	`year_completed` smallint,
	`location` varchar(120),
	`area_sqm` decimal(7,2),
	`budget_range` enum('under_100k','100k_300k','300k_700k','700k_1.5m','1.5m_plus'),
	`cover_media_asset_id` bigint,
	`tone` varchar(7) NOT NULL DEFAULT '#f5d6c0',
	`accent` varchar(7) NOT NULL DEFAULT '#a87856',
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`published_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `works_id` PRIMARY KEY(`id`),
	CONSTRAINT `works_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `media_assets` ADD CONSTRAINT `media_assets_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_pairs` ADD CONSTRAINT `media_pairs_before_asset_id_media_assets_id_fk` FOREIGN KEY (`before_asset_id`) REFERENCES `media_assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_pairs` ADD CONSTRAINT `media_pairs_after_asset_id_media_assets_id_fk` FOREIGN KEY (`after_asset_id`) REFERENCES `media_assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_images` ADD CONSTRAINT `post_images_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_images` ADD CONSTRAINT `post_images_media_asset_id_media_assets_id_fk` FOREIGN KEY (`media_asset_id`) REFERENCES `media_assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_tags` ADD CONSTRAINT `post_tags_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_tags` ADD CONSTRAINT `post_tags_tag_id_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_cover_media_asset_id_media_assets_id_fk` FOREIGN KEY (`cover_media_asset_id`) REFERENCES `media_assets`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_images` ADD CONSTRAINT `work_images_work_id_works_id_fk` FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_images` ADD CONSTRAINT `work_images_media_asset_id_media_assets_id_fk` FOREIGN KEY (`media_asset_id`) REFERENCES `media_assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_images` ADD CONSTRAINT `work_images_pair_id_media_pairs_id_fk` FOREIGN KEY (`pair_id`) REFERENCES `media_pairs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_tags` ADD CONSTRAINT `work_tags_work_id_works_id_fk` FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_tags` ADD CONSTRAINT `work_tags_tag_id_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `works` ADD CONSTRAINT `works_cover_media_asset_id_media_assets_id_fk` FOREIGN KEY (`cover_media_asset_id`) REFERENCES `media_assets`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `contact_inquiries_status_idx` ON `contact_inquiries` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `media_assets_created_idx` ON `media_assets` (`created_at`);--> statement-breakpoint
CREATE INDEX `media_assets_title_idx` ON `media_assets` (`title`);--> statement-breakpoint
CREATE INDEX `media_pairs_after_idx` ON `media_pairs` (`after_asset_id`);--> statement-breakpoint
CREATE INDEX `post_images_asset_idx` ON `post_images` (`media_asset_id`);--> statement-breakpoint
CREATE INDEX `post_tags_tag_idx` ON `post_tags` (`tag_id`);--> statement-breakpoint
CREATE INDEX `posts_status_published_idx` ON `posts` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `posts_author_idx` ON `posts` (`author_id`);--> statement-breakpoint
CREATE INDEX `posts_cover_idx` ON `posts` (`cover_media_asset_id`);--> statement-breakpoint
CREATE INDEX `work_images_asset_idx` ON `work_images` (`media_asset_id`);--> statement-breakpoint
CREATE INDEX `work_images_pair_idx` ON `work_images` (`pair_id`);--> statement-breakpoint
CREATE INDEX `work_tags_tag_idx` ON `work_tags` (`tag_id`);--> statement-breakpoint
CREATE INDEX `works_status_published_idx` ON `works` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `works_room_style_idx` ON `works` (`room_type`,`style`);--> statement-breakpoint
CREATE INDEX `works_cover_idx` ON `works` (`cover_media_asset_id`);