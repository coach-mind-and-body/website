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
  \`dueAt\` timestamp NOT NULL,
  \`sentAt\` timestamp NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`coach_reply_email_notices_id\` PRIMARY KEY(\`id\`),
  UNIQUE KEY \`coach_reply_email_notices_message\` (\`messageId\`),
  KEY \`coach_reply_email_notices_due\` (\`sentAt\`, \`dueAt\`)
)
`;

let ready: Promise<void> | null = null;

/** Idempotent tables for APNs device tokens and the unread coach-reply email. Safe on every boot. */
export async function ensureApnsSchema(db: Db): Promise<void> {
  if (!ready) {
    ready = db
      .execute(sql.raw(CREATE_DEVICE_TOKENS))
      .then(() => db.execute(sql.raw(CREATE_EMAIL_NOTICES)))
      .then(() => undefined)
      .catch((err) => {
        ready = null;
        throw err;
      });
  }
  await ready;
}
