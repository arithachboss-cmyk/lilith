CREATE TABLE `mp_agreements` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`offer_id` text NOT NULL,
	`status` text NOT NULL,
	`document_id` text,
	`signed_at` text,
	FOREIGN KEY (`room_id`) REFERENCES `mp_deal_rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`offer_id`) REFERENCES `mp_offers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`document_id`) REFERENCES `mp_property_documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `mp_ai_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`use_case` text NOT NULL,
	`model` text NOT NULL,
	`prompt_version` text NOT NULL,
	`latency_ms` integer NOT NULL,
	`success` integer NOT NULL,
	`usage` text NOT NULL,
	`error_code` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `mp_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `mp_audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`resource_id` text NOT NULL,
	`details` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `mp_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `mp_audit_resource` ON `mp_audit_logs` (`resource_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `mp_deal_participants` (
	`room_id` text NOT NULL,
	`user_id` text NOT NULL,
	`side` text NOT NULL,
	PRIMARY KEY(`room_id`, `user_id`),
	FOREIGN KEY (`room_id`) REFERENCES `mp_deal_rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `mp_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mp_room_side` ON `mp_deal_participants` (`room_id`,`side`);--> statement-breakpoint
CREATE INDEX `mp_participant_user` ON `mp_deal_participants` (`user_id`);--> statement-breakpoint
CREATE TABLE `mp_deal_rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`state` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`last_operation_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `mp_matches`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "mp_deal_state" CHECK("mp_deal_rooms"."state" IN ('DEAL_ROOM_OPENED','VIEWING_REQUESTED','VIEWING_CONFIRMED','VIEWING_COMPLETED','OFFER_SUBMITTED','COUNTER_OFFER','NEGOTIATION','AGREEMENT_PENDING','AGREEMENT_SIGNED','DEAL_CLOSED','CANCELLED'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mp_deal_rooms_match_id_unique` ON `mp_deal_rooms` (`match_id`);--> statement-breakpoint
CREATE TABLE `mp_deals` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`agreement_id` text NOT NULL,
	`transaction_value` text NOT NULL,
	`currency` text NOT NULL,
	`closed_at` text NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `mp_deal_rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`agreement_id`) REFERENCES `mp_agreements`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mp_deals_room_id_unique` ON `mp_deals` (`room_id`);--> statement-breakpoint
CREATE TABLE `mp_events` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`actor_id` text NOT NULL,
	`resource_id` text NOT NULL,
	`payload` text NOT NULL,
	`dedup_key` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `mp_users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "mp_event_kind" CHECK("mp_events"."kind" IN ('DOMAIN','ANALYTICS'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mp_events_dedup_key_unique` ON `mp_events` (`dedup_key`);--> statement-breakpoint
CREATE INDEX `mp_event_resource` ON `mp_events` (`resource_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `mp_fee_policies` (
	`id` text PRIMARY KEY NOT NULL,
	`rate` text NOT NULL,
	`basis` text NOT NULL,
	`currency` text NOT NULL,
	`active` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mp_fees` (
	`id` text PRIMARY KEY NOT NULL,
	`deal_id` text NOT NULL,
	`policy_id` text NOT NULL,
	`transaction_value` text NOT NULL,
	`fee_basis` text NOT NULL,
	`fee_rate` text NOT NULL,
	`fee_amount` text NOT NULL,
	`currency` text NOT NULL,
	`invoice_status` text NOT NULL,
	`payment_status` text NOT NULL,
	FOREIGN KEY (`deal_id`) REFERENCES `mp_deals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`policy_id`) REFERENCES `mp_fee_policies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mp_fees_deal_id_unique` ON `mp_fees` (`deal_id`);--> statement-breakpoint
CREATE TABLE `mp_interests` (
	`match_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`side` text NOT NULL,
	`decision` text NOT NULL,
	`operation_id` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`match_id`, `side`),
	FOREIGN KEY (`match_id`) REFERENCES `mp_matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `mp_users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "mp_interest_side" CHECK("mp_interests"."side" IN ('SUPPLY','DEMAND')),
	CONSTRAINT "mp_interest_decision" CHECK("mp_interests"."decision" IN ('PASS','INTERESTED','SUPER_MATCH'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mp_interest_actor` ON `mp_interests` (`match_id`,`actor_id`);--> statement-breakpoint
CREATE TABLE `mp_match_reasons` (
	`match_id` text NOT NULL,
	`code` text NOT NULL,
	`matched` integer NOT NULL,
	`explanation` text NOT NULL,
	PRIMARY KEY(`match_id`, `code`),
	FOREIGN KEY (`match_id`) REFERENCES `mp_matches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `mp_match_scores` (
	`match_id` text PRIMARY KEY NOT NULL,
	`score` integer NOT NULL,
	`confidence` real NOT NULL,
	`hard_constraint_passed` integer NOT NULL,
	`result` text NOT NULL,
	`weights` text NOT NULL,
	`engine_version` text NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `mp_matches`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "mp_score_range" CHECK("mp_match_scores"."score" BETWEEN 0 AND 100 AND "mp_match_scores"."confidence" BETWEEN 0 AND 1)
);
--> statement-breakpoint
CREATE TABLE `mp_matches` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`requirement_id` text NOT NULL,
	`status` text DEFAULT 'MATCH_CREATED' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `mp_properties`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requirement_id`) REFERENCES `mp_requirements`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "mp_match_status" CHECK("mp_matches"."status" IN ('MATCH_CREATED','INTEREST_EXPRESSED','MUTUAL_MATCH'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mp_match_pair` ON `mp_matches` (`property_id`,`requirement_id`);--> statement-breakpoint
CREATE TABLE `mp_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`body` text NOT NULL,
	`request_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `mp_deal_rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sender_id`) REFERENCES `mp_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mp_message_request` ON `mp_messages` (`sender_id`,`request_id`);--> statement-breakpoint
CREATE INDEX `mp_message_room` ON `mp_messages` (`room_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `mp_negotiations` (
	`id` text PRIMARY KEY NOT NULL,
	`offer_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`terms` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`offer_id`) REFERENCES `mp_offers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `mp_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `mp_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`event_key` text NOT NULL,
	`title` text NOT NULL,
	`href` text NOT NULL,
	`read_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `mp_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mp_notification_event` ON `mp_notifications` (`user_id`,`event_key`);--> statement-breakpoint
CREATE INDEX `mp_notification_user` ON `mp_notifications` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `mp_offers` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`submitted_by` text NOT NULL,
	`amount` text NOT NULL,
	`currency` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `mp_deal_rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`submitted_by`) REFERENCES `mp_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `mp_organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mp_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`fee_id` text NOT NULL,
	`provider_reference` text NOT NULL,
	`amount` text NOT NULL,
	`currency` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`fee_id`) REFERENCES `mp_fees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mp_payments_provider_reference_unique` ON `mp_payments` (`provider_reference`);--> statement-breakpoint
CREATE TABLE `mp_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `mp_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `mp_properties` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`transaction_type` text NOT NULL,
	`property_type` text NOT NULL,
	`location` text NOT NULL,
	`price` text NOT NULL,
	`currency` text NOT NULL,
	`bedrooms` integer NOT NULL,
	`area_sqm` real NOT NULL,
	`facilities` text NOT NULL,
	`status` text DEFAULT 'PUBLISHED' NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `mp_users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "mp_property_transaction" CHECK("mp_properties"."transaction_type" IN ('RENT','SALE')),
	CONSTRAINT "mp_property_currency" CHECK("mp_properties"."currency" = 'THB'),
	CONSTRAINT "mp_property_status" CHECK("mp_properties"."status" IN ('DRAFT','PUBLISHED','ARCHIVED')),
	CONSTRAINT "mp_property_rooms" CHECK("mp_properties"."bedrooms" >= 0 AND "mp_properties"."area_sqm" > 0)
);
--> statement-breakpoint
CREATE INDEX `mp_property_search` ON `mp_properties` (`transaction_type`,`property_type`,`status`);--> statement-breakpoint
CREATE INDEX `mp_property_owner` ON `mp_properties` (`owner_id`);--> statement-breakpoint
CREATE TABLE `mp_property_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`object_key` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `mp_properties`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mp_property_documents_object_key_unique` ON `mp_property_documents` (`object_key`);--> statement-breakpoint
CREATE TABLE `mp_property_media` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`object_key` text NOT NULL,
	`mime_type` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `mp_properties`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mp_property_media_object_key_unique` ON `mp_property_media` (`object_key`);--> statement-breakpoint
CREATE TABLE `mp_requirement_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`requirement_id` text NOT NULL,
	`name` text NOT NULL,
	`value` text NOT NULL,
	`hard` integer NOT NULL,
	FOREIGN KEY (`requirement_id`) REFERENCES `mp_requirements`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `mp_requirements` (
	`id` text PRIMARY KEY NOT NULL,
	`created_by` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`transaction_type` text NOT NULL,
	`property_type` text NOT NULL,
	`budget_max` text NOT NULL,
	`currency` text NOT NULL,
	`locations` text NOT NULL,
	`min_bedrooms` integer NOT NULL,
	`facilities` text NOT NULL,
	`hard_budget` integer NOT NULL,
	`hard_location` integer NOT NULL,
	`consent_at` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `mp_users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "mp_requirement_transaction" CHECK("mp_requirements"."transaction_type" IN ('RENT','SALE')),
	CONSTRAINT "mp_requirement_currency" CHECK("mp_requirements"."currency" = 'THB'),
	CONSTRAINT "mp_requirement_status" CHECK("mp_requirements"."status" IN ('ACTIVE','CLOSED'))
);
--> statement-breakpoint
CREATE INDEX `mp_requirement_author` ON `mp_requirements` (`created_by`);--> statement-breakpoint
CREATE INDEX `mp_requirement_search` ON `mp_requirements` (`transaction_type`,`property_type`,`status`);--> statement-breakpoint
CREATE TABLE `mp_roles` (
	`name` text PRIMARY KEY NOT NULL,
	CONSTRAINT "mp_role_name" CHECK("mp_roles"."name" IN ('OWNER','AGENT','CLIENT','ADMIN','OPERATOR'))
);
--> statement-breakpoint
CREATE TABLE `mp_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`organization_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`role`) REFERENCES `mp_roles`(`name`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `mp_organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `mp_verification_records` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` text NOT NULL,
	`subject_type` text NOT NULL,
	`reviewed_by` text NOT NULL,
	`status` text NOT NULL,
	`evidence` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`reviewed_by`) REFERENCES `mp_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `mp_viewings` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`requested_by` text NOT NULL,
	`scheduled_at` text NOT NULL,
	`notes` text NOT NULL,
	`status` text NOT NULL,
	`request_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `mp_deal_rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by`) REFERENCES `mp_users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "mp_viewing_status" CHECK("mp_viewings"."status" IN ('REQUESTED','CONFIRMED','COMPLETED','CANCELLED'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mp_viewing_request` ON `mp_viewings` (`requested_by`,`request_id`);--> statement-breakpoint
CREATE INDEX `mp_viewing_room` ON `mp_viewings` (`room_id`);--> statement-breakpoint
INSERT INTO mp_roles (name) VALUES ('OWNER'),('AGENT'),('CLIENT'),('ADMIN'),('OPERATOR');
--> statement-breakpoint
-- Policy configuration only. No users, listings, deals or payments are seeded.
INSERT INTO mp_fee_policies (id,rate,basis,currency,active,created_at) VALUES ('success-thb-v1','0.001','TRANSACTION_VALUE','THB',1,'2026-09-08T00:00:00.000Z');
