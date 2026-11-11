ALTER TABLE `conversations` ADD `coachLastReadAt` timestamp NULL;
ALTER TABLE `coach_reply_email_notices` ADD `kind` varchar(16) NOT NULL DEFAULT 'client';
