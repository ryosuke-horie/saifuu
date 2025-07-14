DROP TABLE `categories`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`amount` real NOT NULL,
	`billing_cycle` text DEFAULT 'monthly' NOT NULL,
	`next_billing_date` text NOT NULL,
	`category_id` integer,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_subscriptions`("id", "name", "amount", "billing_cycle", "next_billing_date", "category_id", "description", "is_active", "created_at", "updated_at") SELECT "id", "name", "amount", "billing_cycle", "next_billing_date", "category_id", "description", "is_active", "created_at", "updated_at" FROM `subscriptions`;--> statement-breakpoint
DROP TABLE `subscriptions`;--> statement-breakpoint
ALTER TABLE `__new_subscriptions` RENAME TO `subscriptions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`category_id` integer,
	`description` text,
	`date` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("id", "amount", "type", "category_id", "description", "date", "created_at", "updated_at") SELECT "id", "amount", "type", "category_id", "description", "date", "created_at", "updated_at" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;