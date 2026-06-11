CREATE TABLE `broadcasted_episodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` varchar(255) NOT NULL,
	`title` varchar(255),
	`broadcastedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `broadcasted_episodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `broadcasted_episodes_videoId_unique` UNIQUE(`videoId`)
);
--> statement-breakpoint
CREATE TABLE `habit_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`order` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `habit_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `podcast_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`firstName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `podcast_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `podcast_subscribers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `user_habit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userHabitId` int NOT NULL,
	`userId` int NOT NULL,
	`dateStr` varchar(10) NOT NULL,
	`completed` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_habit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_habits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`order` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_habits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `assignment_submissions` MODIFY COLUMN `answer` text;--> statement-breakpoint
ALTER TABLE `assignment_submissions` ADD `fileUrl` varchar(1000);--> statement-breakpoint
ALTER TABLE `enrollments` ADD `program` enum('fpu','reclaim') DEFAULT 'reclaim' NOT NULL;