-- Multi-program enrollments.
-- Idempotent when applied by scripts/migrate-program-enrollments.ts
-- (duplicate column / duplicate index errors are ignored).
-- Running this file by hand a second time may error on ADD COLUMN or CREATE INDEX.
-- Those errors mean the step is already done.
--
-- Does not copy fpu_orders or user_challenges.
-- Existing reclaim and fpu enrollment rows keep their program value.
-- If one person has two rows for the same program, the oldest row is kept.
-- Sessions, client files, and follow-ups on the extra rows move onto that oldest row.

ALTER TABLE `users`
  ADD COLUMN `appleId` varchar(128) NULL;

ALTER TABLE `enrollments`
  MODIFY COLUMN `program` ENUM('fpu','reclaim','challenge','holiday','metabolic') NOT NULL DEFAULT 'reclaim';

UPDATE `coaching_sessions` cs
INNER JOIN `enrollments` dup ON dup.id = cs.enrollmentId
INNER JOIN (
  SELECT userId, program, MIN(id) AS keepId
  FROM `enrollments`
  GROUP BY userId, program
  HAVING COUNT(*) > 1
) keepers ON keepers.userId = dup.userId AND keepers.program = dup.program AND dup.id <> keepers.keepId
SET cs.enrollmentId = keepers.keepId;

UPDATE `client_files` cf
INNER JOIN `enrollments` dup ON dup.id = cf.enrollmentId
INNER JOIN (
  SELECT userId, program, MIN(id) AS keepId
  FROM `enrollments`
  GROUP BY userId, program
  HAVING COUNT(*) > 1
) keepers ON keepers.userId = dup.userId AND keepers.program = dup.program AND dup.id <> keepers.keepId
SET cf.enrollmentId = keepers.keepId;

UPDATE `follow_ups` fu
INNER JOIN `enrollments` dup ON dup.id = fu.enrollmentId
INNER JOIN (
  SELECT userId, program, MIN(id) AS keepId
  FROM `enrollments`
  GROUP BY userId, program
  HAVING COUNT(*) > 1
) keepers ON keepers.userId = dup.userId AND keepers.program = dup.program AND dup.id <> keepers.keepId
SET fu.enrollmentId = keepers.keepId;

DELETE e FROM `enrollments` e
INNER JOIN (
  SELECT userId, program, MIN(id) AS keepId
  FROM `enrollments`
  GROUP BY userId, program
  HAVING COUNT(*) > 1
) keepers ON keepers.userId = e.userId AND keepers.program = e.program AND e.id <> keepers.keepId;

CREATE UNIQUE INDEX `enrollments_user_program` ON `enrollments` (`userId`, `program`);

ALTER TABLE `holiday_applications`
  ADD COLUMN `status` enum('pending','accepted') NOT NULL DEFAULT 'pending';

ALTER TABLE `holiday_applications`
  ADD COLUMN `enrollmentId` int NULL;

ALTER TABLE `holiday_applications`
  ADD COLUMN `acceptedAt` timestamp NULL;
