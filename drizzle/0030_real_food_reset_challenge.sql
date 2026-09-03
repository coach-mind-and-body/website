ALTER TABLE `challenges` ADD `meetUrl` varchar(1000);
ALTER TABLE `user_challenges` ADD `email` varchar(320);
ALTER TABLE `user_challenges` ADD `claimToken` varchar(64);
CREATE TABLE IF NOT EXISTS `user_challenge_journals` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userChallengeId` int NOT NULL,
  `dateStr` date NOT NULL,
  `noticed` text,
  `glad` text,
  `hard` text,
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `user_challenge_journals_id` PRIMARY KEY(`id`)
);
