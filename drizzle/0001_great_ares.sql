CREATE TABLE `docs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`notebook_id` integer NOT NULL,
	`slug` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`keywords` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `docs_notebook_id_unique` ON `docs` (`notebook_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `docs_slug_unique` ON `docs` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_docs_slug` ON `docs` (`slug`);