-- Fillable forms and grouped library pages.
-- Applied on boot by server/ensureFormSchema.ts, which ignores duplicate-column errors.
-- Running this file by hand a second time may error on ADD COLUMN. That means the step is already done.
-- Original library files are not deleted. groupId is only a pointer and ungroup clears it.
-- Program checks for library files are common_file_programs (0033_program_content.sql).

CREATE TABLE IF NOT EXISTS `library_groups` (
  `id` int AUTO_INCREMENT NOT NULL,
  `title` varchar(500) NOT NULL,
  `createdByUserId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `library_groups_id` PRIMARY KEY(`id`)
);

ALTER TABLE `common_files` ADD COLUMN `groupId` int NULL;
ALTER TABLE `common_files` ADD COLUMN `pageOrder` int NOT NULL DEFAULT 0;

ALTER TABLE `assignments` MODIFY COLUMN `moduleId` int NULL;
ALTER TABLE `assignments` ADD COLUMN `title` varchar(500) NULL;
ALTER TABLE `assignments` ADD COLUMN `instructions` text NULL;
ALTER TABLE `assignments` ADD COLUMN `fieldsJson` text NULL;
ALTER TABLE `assignments` ADD COLUMN `programTags` text NULL;
ALTER TABLE `assignments` ADD COLUMN `publishStatus` enum('draft','published') NOT NULL DEFAULT 'published';
ALTER TABLE `assignments` ADD COLUMN `kind` enum('fillable','handout') NOT NULL DEFAULT 'fillable';
ALTER TABLE `assignments` ADD COLUMN `content` text NULL;
ALTER TABLE `assignments` ADD COLUMN `sourceFileIds` text NULL;

ALTER TABLE `assignment_submissions` ADD COLUMN `answersJson` text NULL;
ALTER TABLE `assignment_submissions` ADD COLUMN `status` enum('draft','submitted','reviewed') NOT NULL DEFAULT 'submitted';
ALTER TABLE `assignment_submissions` ADD COLUMN `reviewedAt` timestamp NULL;
ALTER TABLE `assignment_submissions` ADD COLUMN `reviewedByUserId` int NULL;
