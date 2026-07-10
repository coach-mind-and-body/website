CREATE TABLE `podcast_episodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` varchar(64) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`title` varchar(500) NOT NULL,
	`thumbnail` varchar(1000),
	`publishedAt` timestamp,
	`youtubeDescription` text,
	`showNotesHtml` text,
	`seoTitle` varchar(500),
	`seoDescription` text,
	`transcript` text,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `podcast_episodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `podcast_episodes_videoId_unique` UNIQUE(`videoId`),
	CONSTRAINT `podcast_episodes_slug_unique` UNIQUE(`slug`)
);
