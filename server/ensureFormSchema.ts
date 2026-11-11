import { sql } from "drizzle-orm";
import type { getDb } from "./db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/**
 * Idempotent columns for fillable forms and grouped library pages.
 * Runs after ensureProgramEnrollmentSchema. Does not create or alter
 * common_file_programs, program_modules.program, or the intake tables.
 * Library program checks live only in common_file_programs.
 * Assignment programTags is the form audience, which is separate.
 * Safe to run on every boot. Duplicate column and duplicate key errors are ignored.
 */

const CREATE_LIBRARY_GROUPS = `
CREATE TABLE IF NOT EXISTS \`library_groups\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`title\` varchar(500) NOT NULL,
  \`createdByUserId\` int NOT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`library_groups_id\` PRIMARY KEY(\`id\`)
)
`;

const CREATE_COMMON_FILES = `
CREATE TABLE IF NOT EXISTS \`common_files\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`fileName\` varchar(500) NOT NULL,
  \`fileKey\` varchar(1000) NOT NULL,
  \`fileUrl\` varchar(2000) NOT NULL,
  \`mimeType\` varchar(255),
  \`uploadedByUserId\` int NOT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`groupId\` int NULL,
  \`pageOrder\` int NOT NULL DEFAULT 0,
  CONSTRAINT \`common_files_id\` PRIMARY KEY(\`id\`)
)
`;

const ADD_COMMON_GROUP = `ALTER TABLE \`common_files\` ADD COLUMN \`groupId\` int NULL`;
const ADD_COMMON_PAGE = `ALTER TABLE \`common_files\` ADD COLUMN \`pageOrder\` int NOT NULL DEFAULT 0`;

const NULLABLE_MODULE = `ALTER TABLE \`assignments\` MODIFY COLUMN \`moduleId\` int NULL`;
const ADD_TITLE = `ALTER TABLE \`assignments\` ADD COLUMN \`title\` varchar(500) NULL`;
const ADD_INSTRUCTIONS = `ALTER TABLE \`assignments\` ADD COLUMN \`instructions\` text NULL`;
const ADD_FIELDS = `ALTER TABLE \`assignments\` ADD COLUMN \`fieldsJson\` text NULL`;
const ADD_FORM_TAGS = `ALTER TABLE \`assignments\` ADD COLUMN \`programTags\` text NULL`;
const ADD_PUBLISH = `ALTER TABLE \`assignments\` ADD COLUMN \`publishStatus\` enum('draft','published') NOT NULL DEFAULT 'published'`;
const ADD_KIND = `ALTER TABLE \`assignments\` ADD COLUMN \`kind\` enum('fillable','handout') NOT NULL DEFAULT 'fillable'`;
const ADD_CONTENT = `ALTER TABLE \`assignments\` ADD COLUMN \`content\` text NULL`;
const ADD_SOURCE = `ALTER TABLE \`assignments\` ADD COLUMN \`sourceFileIds\` text NULL`;

const ADD_ANSWERS = `ALTER TABLE \`assignment_submissions\` ADD COLUMN \`answersJson\` text NULL`;
const ADD_STATUS = `ALTER TABLE \`assignment_submissions\` ADD COLUMN \`status\` enum('draft','submitted','reviewed') NOT NULL DEFAULT 'submitted'`;
const ADD_REVIEWED_AT = `ALTER TABLE \`assignment_submissions\` ADD COLUMN \`reviewedAt\` timestamp NULL`;
const ADD_REVIEWED_BY = `ALTER TABLE \`assignment_submissions\` ADD COLUMN \`reviewedByUserId\` int NULL`;

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

async function runIgnoring(db: Db, statement: string): Promise<void> {
  try {
    await db.execute(sql.raw(statement));
  } catch (err) {
    if (isAlreadyApplied(err)) return;
    throw err;
  }
}

let ready: Promise<void> | null = null;

export async function ensureFormSchema(db: Db): Promise<void> {
  if (!ready) {
    ready = applyFormSchema(db).catch((err) => {
      ready = null;
      throw err;
    });
  }
  await ready;
}

export async function applyFormSchema(db: Db): Promise<void> {
  await db.execute(sql.raw(CREATE_LIBRARY_GROUPS));
  await db.execute(sql.raw(CREATE_COMMON_FILES));
  await runIgnoring(db, ADD_COMMON_GROUP);
  await runIgnoring(db, ADD_COMMON_PAGE);
  await runIgnoring(db, NULLABLE_MODULE);
  await runIgnoring(db, ADD_TITLE);
  await runIgnoring(db, ADD_INSTRUCTIONS);
  await runIgnoring(db, ADD_FIELDS);
  await runIgnoring(db, ADD_FORM_TAGS);
  await runIgnoring(db, ADD_PUBLISH);
  await runIgnoring(db, ADD_KIND);
  await runIgnoring(db, ADD_CONTENT);
  await runIgnoring(db, ADD_SOURCE);
  await runIgnoring(db, ADD_ANSWERS);
  await runIgnoring(db, ADD_STATUS);
  await runIgnoring(db, ADD_REVIEWED_AT);
  await runIgnoring(db, ADD_REVIEWED_BY);
}
