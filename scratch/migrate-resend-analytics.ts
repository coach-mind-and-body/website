import "dotenv/config";
import mysql from "mysql2/promise";

async function run(c: mysql.Connection, sql: string, label: string) {
  try {
    await c.query(sql);
    console.log("OK:", label);
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (
      err.code === "ER_DUP_FIELDNAME" ||
      err.code === "ER_TABLE_EXISTS_ERROR" ||
      err.code === "ER_DUP_KEYNAME" ||
      err.message?.includes("Duplicate column") ||
      err.message?.includes("already exists")
    ) {
      console.log("SKIP:", label, err.code || err.message);
      return;
    }
    console.error("FAIL:", label, err.message || e);
    throw e;
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("No DATABASE_URL");
  const c = await mysql.createConnection(url);
  try {
    await run(
      c,
      `ALTER TABLE email_newsletter_sends ADD COLUMN resendEmailId varchar(64) NULL`,
      "resendEmailId"
    );
    await run(
      c,
      `ALTER TABLE email_newsletter_sends ADD COLUMN deliveryStatus ENUM('unknown','sent','delivered','delivery_delayed','bounced','complained','failed') NOT NULL DEFAULT 'unknown'`,
      "deliveryStatus"
    );
    await run(
      c,
      `ALTER TABLE email_newsletter_sends ADD COLUMN openCount int NOT NULL DEFAULT 0`,
      "openCount"
    );
    await run(
      c,
      `ALTER TABLE email_newsletter_sends ADD COLUMN clickCount int NOT NULL DEFAULT 0`,
      "clickCount"
    );
    await run(
      c,
      `ALTER TABLE email_newsletter_sends ADD COLUMN deliveredAt timestamp NULL`,
      "deliveredAt"
    );
    await run(
      c,
      `ALTER TABLE email_newsletter_sends ADD COLUMN firstOpenedAt timestamp NULL`,
      "firstOpenedAt"
    );
    await run(
      c,
      `ALTER TABLE email_newsletter_sends ADD COLUMN lastOpenedAt timestamp NULL`,
      "lastOpenedAt"
    );
    await run(
      c,
      `ALTER TABLE email_newsletter_sends ADD COLUMN firstClickedAt timestamp NULL`,
      "firstClickedAt"
    );
    await run(
      c,
      `ALTER TABLE email_newsletter_sends ADD COLUMN lastClickedAt timestamp NULL`,
      "lastClickedAt"
    );
    await run(
      c,
      `ALTER TABLE email_newsletter_sends ADD COLUMN bouncedAt timestamp NULL`,
      "bouncedAt"
    );
    await run(
      c,
      `ALTER TABLE email_newsletter_sends ADD COLUMN complainedAt timestamp NULL`,
      "complainedAt"
    );
    await run(
      c,
      `ALTER TABLE email_newsletter_sends ADD COLUMN updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
      "updatedAt"
    );
    await run(
      c,
      `CREATE INDEX idx_nls_resend ON email_newsletter_sends (resendEmailId)`,
      "index resendEmailId"
    );

    await run(
      c,
      `CREATE TABLE IF NOT EXISTS resend_webhook_events (
        id int AUTO_INCREMENT NOT NULL,
        svixId varchar(128) NOT NULL,
        eventType varchar(64) NOT NULL,
        resendEmailId varchar(64),
        payloadJson text,
        processedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY resend_webhook_events_svixId (svixId),
        KEY idx_rwe_email (resendEmailId)
      )`,
      "resend_webhook_events"
    );

    console.log("Migration complete.");
  } finally {
    await c.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
