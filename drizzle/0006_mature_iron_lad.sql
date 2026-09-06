PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_agent_properties` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`area` text NOT NULL,
	`rent` integer NOT NULL,
	`bedrooms` integer NOT NULL,
	`size` real NOT NULL,
	`tier` integer NOT NULL,
	`status` text NOT NULL,
	`owner` text NOT NULL,
	`photos` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_agent_properties`("id", "name", "area", "rent", "bedrooms", "size", "tier", "status", "owner", "photos", "updated_at") SELECT "id", "name", "area", "rent", "bedrooms", "size", "tier", "status", "owner", "photos", "updated_at" FROM `agent_properties`;--> statement-breakpoint
DROP TABLE `agent_properties`;--> statement-breakpoint
ALTER TABLE `__new_agent_properties` RENAME TO `agent_properties`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `agent_properties_tier` ON `agent_properties` (`tier`);--> statement-breakpoint
CREATE TABLE `__new_agent_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agent_id` text NOT NULL,
	`reviewer` text NOT NULL,
	`score` integer NOT NULL,
	`tier` integer NOT NULL,
	`note` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_agent_reviews`("id", "agent_id", "reviewer", "score", "tier", "note", "created_at") SELECT "id", "agent_id", "reviewer", "score", "tier", "note", "created_at" FROM `agent_reviews`;--> statement-breakpoint
DROP TABLE `agent_reviews`;--> statement-breakpoint
ALTER TABLE `__new_agent_reviews` RENAME TO `agent_reviews`;