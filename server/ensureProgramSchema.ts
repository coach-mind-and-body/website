import { sql } from "drizzle-orm";
import type { getDb } from "./db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/**
 * Idempotent schema step for multi-program enrollment.
 * Safe to run more than once. Does not copy fpu_orders or user_challenges.
 * Duplicate (user, program) rows: keep the oldest, move sessions and files onto it, then delete the extras.
 */
const MODIFY_PROGRAM_ENUM = `
ALTER TABLE \`enrollments\`
  MODIFY COLUMN \`program\` ENUM('fpu','reclaim','challenge','holiday','metabolic') NOT NULL DEFAULT 'reclaim'
`;

const REPOINT_SESSIONS = `
UPDATE \`coaching_sessions\` cs
INNER JOIN \`enrollments\` dup ON dup.id = cs.enrollmentId
INNER JOIN (
  SELECT userId, program, MIN(id) AS keepId
  FROM \`enrollments\`
  GROUP BY userId, program
  HAVING COUNT(*) > 1
) keepers ON keepers.userId = dup.userId AND keepers.program = dup.program AND dup.id <> keepers.keepId
SET cs.enrollmentId = keepers.keepId
`;

const REPOINT_FILES = `
UPDATE \`client_files\` cf
INNER JOIN \`enrollments\` dup ON dup.id = cf.enrollmentId
INNER JOIN (
  SELECT userId, program, MIN(id) AS keepId
  FROM \`enrollments\`
  GROUP BY userId, program
  HAVING COUNT(*) > 1
) keepers ON keepers.userId = dup.userId AND keepers.program = dup.program AND dup.id <> keepers.keepId
SET cf.enrollmentId = keepers.keepId
`;

const REPOINT_FOLLOWUPS = `
UPDATE \`follow_ups\` fu
INNER JOIN \`enrollments\` dup ON dup.id = fu.enrollmentId
INNER JOIN (
  SELECT userId, program, MIN(id) AS keepId
  FROM \`enrollments\`
  GROUP BY userId, program
  HAVING COUNT(*) > 1
) keepers ON keepers.userId = dup.userId AND keepers.program = dup.program AND dup.id <> keepers.keepId
SET fu.enrollmentId = keepers.keepId
`;

const DELETE_DUPLICATE_ENROLLMENTS = `
DELETE e FROM \`enrollments\` e
INNER JOIN (
  SELECT userId, program, MIN(id) AS keepId
  FROM \`enrollments\`
  GROUP BY userId, program
  HAVING COUNT(*) > 1
) keepers ON keepers.userId = e.userId AND keepers.program = e.program AND e.id <> keepers.keepId
`;

const CREATE_UNIQUE_INDEX = `
CREATE UNIQUE INDEX \`enrollments_user_program\` ON \`enrollments\` (\`userId\`, \`program\`)
`;

const CREATE_HOLIDAY_APPLICATIONS = `
CREATE TABLE IF NOT EXISTS \`holiday_applications\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`fullName\` varchar(200) NOT NULL,
  \`email\` varchar(320) NOT NULL,
  \`phone\` varchar(40) NOT NULL,
  \`age18\` enum('yes','no') NOT NULL,
  \`newToFasting\` enum('yes','no') NOT NULL,
  \`pregnantOrBreastfeeding\` enum('yes','no') NOT NULL,
  \`eatingDisorder\` enum('yes','no') NOT NULL,
  \`addiction\` enum('yes','no') NOT NULL,
  \`twelveStep\` enum('yes','no') NOT NULL,
  \`moodMedication\` enum('yes','no') NOT NULL,
  \`takeResponsibility\` enum('yes','no') NOT NULL,
  \`whyCoaching\` text NOT NULL,
  \`hopes\` text NOT NULL,
  \`buyKetoMojo\` enum('yes','no') NOT NULL,
  \`logFood\` enum('yes','no') NOT NULL,
  \`commitFiveWeeks\` enum('yes','no') NOT NULL,
  \`weeklyZoom\` enum('yes','no') NOT NULL,
  \`actionSteps\` enum('yes','no') NOT NULL,
  \`availableNov3to8\` enum('yes','no') NOT NULL,
  \`utmSource\` varchar(255),
  \`utmMedium\` varchar(255),
  \`utmCampaign\` varchar(255),
  \`utmContent\` varchar(255),
  \`utmTerm\` varchar(255),
  \`fbclid\` varchar(255),
  \`fbp\` varchar(255),
  \`fbc\` varchar(512),
  \`landingUrl\` varchar(1000),
  \`eventId\` varchar(80),
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`status\` enum('pending','accepted') NOT NULL DEFAULT 'pending',
  \`enrollmentId\` int NULL,
  \`acceptedAt\` timestamp NULL,
  CONSTRAINT \`holiday_applications_id\` PRIMARY KEY(\`id\`),
  KEY \`holiday_applications_email\` (\`email\`),
  KEY \`holiday_applications_created\` (\`createdAt\`)
)
`;

const ADD_HOLIDAY_STATUS = `
ALTER TABLE \`holiday_applications\`
  ADD COLUMN \`status\` enum('pending','accepted') NOT NULL DEFAULT 'pending'
`;

const ADD_HOLIDAY_ENROLLMENT_ID = `
ALTER TABLE \`holiday_applications\`
  ADD COLUMN \`enrollmentId\` int NULL
`;

const ADD_HOLIDAY_ACCEPTED_AT = `
ALTER TABLE \`holiday_applications\`
  ADD COLUMN \`acceptedAt\` timestamp NULL
`;

const ADD_USER_APPLE_ID = `
ALTER TABLE \`users\`
  ADD COLUMN \`appleId\` varchar(128) NULL
`;

const ADD_MODULE_PROGRAM = `
ALTER TABLE \`program_modules\`
  ADD COLUMN \`program\` ENUM('fpu','reclaim','challenge','holiday','metabolic') NOT NULL DEFAULT 'reclaim'
`;

const CREATE_COMMON_FILE_PROGRAMS = `
CREATE TABLE IF NOT EXISTS \`common_file_programs\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`commonFileId\` int NOT NULL,
  \`program\` ENUM('fpu','reclaim','challenge','holiday','metabolic') NOT NULL,
  CONSTRAINT \`common_file_programs_id\` PRIMARY KEY(\`id\`),
  UNIQUE KEY \`common_file_program\` (\`commonFileId\`, \`program\`)
)
`;

function errorText(err: unknown): string {
  const row = err as { code?: string; message?: string; cause?: { code?: string; message?: string } };
  return `${row?.code ?? ""} ${row?.message ?? ""} ${row?.cause?.code ?? ""} ${row?.cause?.message ?? ""} ${String(err)}`;
}

function isAlreadyApplied(err: unknown): boolean {
  const text = errorText(err);
  return (
    text.includes("ER_DUP_FIELDNAME") ||
    text.includes("ER_DUP_KEYNAME") ||
    text.includes("Duplicate column") ||
    text.includes("Duplicate key name") ||
    text.includes("already exists") ||
    text.includes("1060") ||
    text.includes("1061")
  );
}

function isMissingTable(err: unknown): boolean {
  const text = errorText(err);
  return text.includes("ER_NO_SUCH_TABLE") || text.includes("doesn't exist") || text.includes("1146");
}

async function run(db: Db, statement: string): Promise<void> {
  await db.execute(sql.raw(statement));
}

async function runIgnoring(db: Db, statement: string, ignoreMissingTable: boolean): Promise<void> {
  try {
    await run(db, statement);
  } catch (err) {
    if (isAlreadyApplied(err)) return;
    if (ignoreMissingTable && isMissingTable(err)) return;
    throw err;
  }
}

let ready: Promise<void> | null = null;

export async function ensureProgramEnrollmentSchema(db: Db): Promise<void> {
  if (!ready) {
    ready = applyProgramEnrollmentSchema(db).catch((err) => {
      ready = null;
      throw err;
    });
  }
  await ready;
}

export async function applyProgramEnrollmentSchema(db: Db): Promise<void> {
  await runIgnoring(db, ADD_USER_APPLE_ID, false);
  await run(db, MODIFY_PROGRAM_ENUM);
  await runIgnoring(db, REPOINT_SESSIONS, true);
  await runIgnoring(db, REPOINT_FILES, true);
  await runIgnoring(db, REPOINT_FOLLOWUPS, true);
  await run(db, DELETE_DUPLICATE_ENROLLMENTS);
  try {
    await run(db, CREATE_UNIQUE_INDEX);
  } catch (err) {
    if (!isAlreadyApplied(err)) {
      console.error(
        "[enrollments] Unique index enrollments_user_program was not added. Check for duplicate user+program rows.",
        err
      );
    }
  }
  await run(db, CREATE_HOLIDAY_APPLICATIONS);
  await runIgnoring(db, ADD_HOLIDAY_STATUS, false);
  await runIgnoring(db, ADD_HOLIDAY_ENROLLMENT_ID, false);
  await runIgnoring(db, ADD_HOLIDAY_ACCEPTED_AT, false);
  await runIgnoring(db, ADD_MODULE_PROGRAM, true);
  await runIgnoring(db, CREATE_COMMON_FILE_PROGRAMS, true);
}
