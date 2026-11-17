CREATE TABLE IF NOT EXISTS `fasting_logs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `dateStr` varchar(10) NOT NULL,
  `didFast` boolean NOT NULL DEFAULT false,
  `hours` double NULL,
  `notes` text NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fasting_logs_id` PRIMARY KEY(`id`),
  UNIQUE KEY `fasting_logs_user_day` (`userId`, `dateStr`)
);
