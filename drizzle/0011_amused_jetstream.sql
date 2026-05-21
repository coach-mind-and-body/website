CREATE TABLE `page_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`page` varchar(100) NOT NULL,
	`key` varchar(100) NOT NULL,
	`publishedContent` text,
	`draftContent` text,
	`hasDraft` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `page_content_id` PRIMARY KEY(`id`)
);
