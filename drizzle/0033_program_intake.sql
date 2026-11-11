-- Program intake links, Needs-program leads, and welcome-on-enroll.
-- Idempotent. Safe to run more than once on deploy.
-- The app also applies these statements from ensureProgramEnrollmentSchema
-- the first time it opens the database.

SET @db := DATABASE();

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'pendingWelcome'
    ),
    'SELECT 1',
    'ALTER TABLE `users` ADD COLUMN `pendingWelcome` boolean NOT NULL DEFAULT false'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'leads' AND COLUMN_NAME = 'needsProgram'
    ),
    'SELECT 1',
    'ALTER TABLE `leads` ADD COLUMN `needsProgram` boolean NOT NULL DEFAULT false'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `program_intake_questions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `program` enum('fpu','reclaim','challenge','holiday','metabolic') NOT NULL,
  `prompt` varchar(500) NOT NULL,
  `sortOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `program_intake_questions_id` PRIMARY KEY(`id`),
  KEY `program_intake_questions_program` (`program`, `sortOrder`)
);

CREATE TABLE IF NOT EXISTS `program_intake_submissions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `program` enum('fpu','reclaim','challenge','holiday','metabolic') NOT NULL,
  `name` varchar(200) NOT NULL,
  `email` varchar(320) NOT NULL,
  `phone` varchar(40) NOT NULL,
  `answersJson` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `program_intake_submissions_id` PRIMARY KEY(`id`),
  UNIQUE KEY `program_intake_submissions_email_program` (`email`, `program`)
);
