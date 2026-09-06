CREATE TABLE `agent_members` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`team` text NOT NULL,
	`tier` integer NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`note` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_members_email_unique` ON `agent_members` (`email`);--> statement-breakpoint
CREATE TABLE `agent_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `agent_properties` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`area` text NOT NULL,
	`rent` integer NOT NULL,
	`bedrooms` integer NOT NULL,
	`size` integer NOT NULL,
	`tier` integer NOT NULL,
	`status` text NOT NULL,
	`owner` text NOT NULL,
	`photos` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `agent_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agent_id` text NOT NULL,
	`reviewer` text NOT NULL,
	`score` integer NOT NULL,
	`tier` integer NOT NULL,
	`note` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
