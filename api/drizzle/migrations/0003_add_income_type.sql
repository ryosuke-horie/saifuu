-- Add income type to transactions table
-- Since SQLite doesn't support ALTER COLUMN for CHECK constraints,
-- we need to recreate the table with the new constraint

PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`amount` real NOT NULL,
	`type` text CHECK(`type` IN ('expense', 'income')) NOT NULL,
	`category_id` integer,
	`description` text,
	`date` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("id", "amount", "type", "category_id", "description", "date", "created_at", "updated_at") SELECT "id", "amount", "type", "category_id", "description", "date", "created_at", "updated_at" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;