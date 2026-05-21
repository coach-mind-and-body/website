CREATE TABLE `fpu_coaching_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fpuOrderId` int NOT NULL,
	`clientEmail` varchar(320) NOT NULL,
	`clientName` varchar(255),
	`sessionNumber` int NOT NULL,
	`googleEventId` varchar(255),
	`completedAt` timestamp,
	`followUpEmailSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fpu_coaching_sessions_id` PRIMARY KEY(`id`)
);
