import { sql } from "drizzle-orm";
import type { getDb } from "./db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const CREATE_FASTING_LOGS = `
CREATE TABLE IF NOT EXISTS \`fasting_logs\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`userId\` int NOT NULL,
  \`dateStr\` varchar(10) NOT NULL,
  \`didFast\` boolean NOT NULL DEFAULT false,
  \`hours\` double NULL,
  \`notes\` text NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT \`fasting_logs_id\` PRIMARY KEY(\`id\`),
  UNIQUE KEY \`fasting_logs_user_day\` (\`userId\`, \`dateStr\`)
)
`;

let ready: Promise<void> | null = null;

/** Idempotent fasting table. Safe on every boot. */
export async function ensureFastingSchema(db: Db): Promise<void> {
  if (!ready) {
    ready = db
      .execute(sql.raw(CREATE_FASTING_LOGS))
      .then(() => undefined)
      .catch((err) => {
        ready = null;
        throw err;
      });
  }
  await ready;
}
