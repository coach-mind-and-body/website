-- Habit tracker: daily ritual + coaching OS
-- Additive only — safe to run on production

ALTER TABLE `challenges`
  ADD COLUMN `startDate` date,
  ADD COLUMN `endDate` date,
  ADD COLUMN `linkedPodcastSlug` varchar(255),
  ADD COLUMN `linkedBlogSlug` varchar(255),
  ADD COLUMN `themeTag` varchar(100),
  ADD COLUMN `featuredOrder` int NOT NULL DEFAULT 0,
  ADD COLUMN `isFeatured` boolean NOT NULL DEFAULT false;

ALTER TABLE `podcast_episodes`
  ADD COLUMN `habitActionsJson` text,
  ADD COLUMN `linkedChallengeId` int,
  ADD COLUMN `linkedBlogSlug` varchar(255);

CREATE TABLE IF NOT EXISTS `user_victory_lists` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int,
  `deviceId` varchar(64),
  `dateStr` varchar(10) NOT NULL,
  `win1` varchar(280) NOT NULL DEFAULT '',
  `win2` varchar(280) NOT NULL DEFAULT '',
  `win3` varchar(280) NOT NULL DEFAULT '',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_victory_lists_userId_dateStr` (`userId`, `dateStr`),
  KEY `user_victory_lists_deviceId_dateStr` (`deviceId`, `dateStr`)
);

CREATE TABLE IF NOT EXISTS `habit_notification_prefs` (
  `userId` int NOT NULL,
  `eveningNudgeEnabled` boolean NOT NULL DEFAULT true,
  `victoryPromptEnabled` boolean NOT NULL DEFAULT true,
  `challengePushEnabled` boolean NOT NULL DEFAULT true,
  `day1Day3Enabled` boolean NOT NULL DEFAULT true,
  `weeklyInsightEmailEnabled` boolean NOT NULL DEFAULT true,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`userId`)
);

CREATE TABLE IF NOT EXISTS `habit_funnel_events` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int,
  `deviceId` varchar(64),
  `eventType` varchar(64) NOT NULL,
  `dateStr` varchar(10) NOT NULL,
  `meta` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `habit_funnel_events_userId` (`userId`),
  KEY `habit_funnel_events_type_date` (`eventType`, `dateStr`)
);

CREATE TABLE IF NOT EXISTS `habit_packs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `slug` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `isActive` boolean NOT NULL DEFAULT true,
  `isDefault` boolean NOT NULL DEFAULT false,
  `sortOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `habit_packs_slug` (`slug`)
);

CREATE TABLE IF NOT EXISTS `habit_pack_items` (
  `id` int AUTO_INCREMENT NOT NULL,
  `packId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `type` enum('boolean','numeric') NOT NULL DEFAULT 'boolean',
  `targetValue` int,
  `unit` varchar(50),
  `sortOrder` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `habit_pack_items_packId` (`packId`)
);

CREATE TABLE IF NOT EXISTS `habit_cron_runs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `kind` varchar(64) NOT NULL,
  `dateStr` varchar(10) NOT NULL,
  `sentCount` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `habit_cron_runs_kind_date` (`kind`, `dateStr`)
);

-- Seed starter packs
INSERT INTO `habit_packs` (`slug`, `title`, `description`, `isActive`, `isDefault`, `sortOrder`)
VALUES
  ('victory-basics', 'Victory Basics', 'Simple daily wins: water, protein, move, and notice what went right.', true, true, 0),
  ('craving-week', 'Craving Week', 'Patterns for nighttime and stress cravings — pause, protein, evening walk.', true, false, 1),
  ('energy-week', 'Energy Week', 'Exercise snacks, sleep wind-down, and steady fuel after 40.', true, false, 2)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- Pack items (ids resolved by slug join in app seed if needed; insert by known pack ids after select)
-- Applied in seed script for safety with auto-increment ids.
