CREATE TABLE `fpu_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stripeSessionId` varchar(255) NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`userId` int,
	`clientName` varchar(255),
	`clientEmail` varchar(320),
	`status` enum('pending','paid','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fpu_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `fpu_orders_stripeSessionId_unique` UNIQUE(`stripeSessionId`)
);
