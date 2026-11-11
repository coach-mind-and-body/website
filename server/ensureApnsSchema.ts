import { sql } from "drizzle-orm";
import type { getDb } from "./db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const CREATE_DEVICE_TOKENS = `
CREATE TABLE IF NOT EXISTS \`apns_device_tokens\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`userId\` int NOT NULL,
  \`token\` varchar(128) NOT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT \`apns_device_tokens_id\` PRIMARY KEY(\`id\`),
  UNIQUE KEY \`apns_device_tokens_token\` (\`token\`),
  KEY \`apns_device_tokens_userId\` (\`userId\`)
)
`;

const CREATE_EMAIL_NOTICES = `
CREATE TABLE IF NOT EXISTS \`coach_reply_email_notices\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`messageId\` int NOT NULL,
  \`conversationId\` int NOT NULL,
  \`userId\` int NOT NULL,
  \`preview\` varchar(500) NOT NULL DEFAULT '',
  \`kind\` varchar(16) NOT NULL DEFAULT 'client',
  \`dueAt\` timestamp NOT NULL,
  \`sentAt\` timestamp NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`coach_reply_email_notices_id\` PRIMARY KEY(\`id\`),
  UNIQUE KEY \`coach_reply_email_notices_message\` (\`messageId\`),
  KEY \`coach_reply_email_notices_due\` (\`sentAt\`, \`dueAt\`)
)
`;

const ADD_NOTICE_KIND = `ALTER TABLE \`coach_reply_email_notices\` ADD \`kind\` varchar(16) NOT NULL DEFAULT 'client'`;
const ADD_COACH_LAST_READ = `ALTER TABLE \`conversations\` ADD \`coachLastReadAt\` timestamp NULL`;

function isAlreadyApplied(err: unknown): boolean {
  const row = err as {
    code?: string;
    message?: string;
    cause?: { code?: string; message?: string };
  };
  const text = `${row?.code ?? ""} ${row?.message ?? ""} ${row?.cause?.code ?? ""} ${row?.cause?.message ?? ""} ${String(err)}`;
  return (
    text.includes("ER_DUP_FIELDNAME") ||
    text.includes("Duplicate column") ||
    text.includes("1060")
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

/** Idempotent tables for APNs tokens and unread message emails. Safe on every boot. */
export async function ensureApnsSchema(db: Db): Promise<void> {
  if (!ready) {
    ready = db
      .execute(sql.raw(CREATE_DEVICE_TOKENS))
      .then(() => db.execute(sql.raw(CREATE_EMAIL_NOTICES)))
      .then(() => runIgnoring(db, ADD_NOTICE_KIND))
      .then(() => runIgnoring(db, ADD_COACH_LAST_READ))
      .then(() => undefined)
      .catch(err => {
        ready = null;
        throw err;
      });
  }
  await ready;
}
