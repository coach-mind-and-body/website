-- Per-program modules and library checkboxes.
-- Idempotent when applied by server/ensureProgramSchema.ts
-- (duplicate column / existing table errors are ignored).
-- Running this file by hand a second time may error on ADD COLUMN.
-- That error means the column is already there.
--
-- Existing program_modules rows become Reclaim. Their ids do not change,
-- so module_progress, assignments, and submissions stay attached.

ALTER TABLE `program_modules`
  ADD COLUMN `program` ENUM('fpu','reclaim','challenge','holiday','metabolic') NOT NULL DEFAULT 'reclaim';

CREATE TABLE IF NOT EXISTS `common_file_programs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `commonFileId` int NOT NULL,
  `program` ENUM('fpu','reclaim','challenge','holiday','metabolic') NOT NULL,
  CONSTRAINT `common_file_programs_id` PRIMARY KEY(`id`),
  UNIQUE KEY `common_file_program` (`commonFileId`, `program`)
);
