CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`source` text NOT NULL,
	`budget` integer NOT NULL,
	`area` text NOT NULL,
	`move_date` text,
	`stage` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
