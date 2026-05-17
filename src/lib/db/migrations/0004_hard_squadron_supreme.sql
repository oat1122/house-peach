-- Demote any rows previously set to 'recent' back to 'none' before dropping
-- the enum value — otherwise MariaDB rejects the MODIFY COLUMN with
-- ER_DATA_TRUNCATED. The "Recent" section is now auto-populated by
-- publishedAt DESC (no admin opt-in), so 'none' is the correct fallback.
UPDATE `works` SET `home_section` = 'none' WHERE `home_section` = 'recent';
--> statement-breakpoint
ALTER TABLE `works` MODIFY COLUMN `home_section` enum('none','discover') NOT NULL DEFAULT 'none';