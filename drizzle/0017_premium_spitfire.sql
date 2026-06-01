CREATE TABLE `sequence_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriberId` int NOT NULL,
	`sequenceId` varchar(255) NOT NULL,
	`currentStep` int NOT NULL DEFAULT 0,
	`lastEmailedAt` timestamp,
	`status` enum('active','completed','cancelled') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sequence_enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`firstName` varchar(255),
	`lastName` varchar(255),
	`segments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscribers_email_unique` UNIQUE(`email`)
);
