/**
 * One-shot migration: newsletter v2 columns + sends/snippets tables.
 * Safe to re-run (IF NOT EXISTS / ignore duplicate column errors).
 */
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
      err.message?.includes("Duplicate column")
    ) {
      console.log("SKIP (exists):", label);
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
      `ALTER TABLE email_newsletters
        MODIFY COLUMN audienceGroup ENUM('finance','health','all','snack_hack') NOT NULL DEFAULT 'health'`,
      "audienceGroup enum + snack_hack"
    );
    await run(
      c,
      `ALTER TABLE email_newsletters
        MODIFY COLUMN status ENUM('draft','scheduled','sending','sent','failed','cancelled') NOT NULL DEFAULT 'draft'`,
      "status enum + scheduled"
    );
    await run(
      c,
      `ALTER TABLE email_newsletters ADD COLUMN greetingTemplate varchar(500) DEFAULT 'Hi {{firstName}},'`,
      "greetingTemplate"
    );
    await run(
      c,
      `ALTER TABLE email_newsletters ADD COLUMN signOffClosing varchar(255) DEFAULT 'With love,'`,
      "signOffClosing"
    );
    await run(
      c,
      `ALTER TABLE email_newsletters ADD COLUMN signOffName varchar(255) DEFAULT 'Lee Anne'`,
      "signOffName"
    );
    await run(
      c,
      `ALTER TABLE email_newsletters ADD COLUMN signOffTitle varchar(500) DEFAULT 'Certified Life & Health Coach · Mind & Body Reset Coaches'`,
      "signOffTitle"
    );
    await run(
      c,
      `ALTER TABLE email_newsletters ADD COLUMN scheduledAt timestamp NULL`,
      "scheduledAt"
    );

    await run(
      c,
      `CREATE TABLE IF NOT EXISTS email_newsletter_sends (
        id int AUTO_INCREMENT NOT NULL,
        newsletterId int NOT NULL,
        email varchar(320) NOT NULL,
        firstName varchar(255),
        status enum('sent','failed','skipped') NOT NULL,
        errorMessage varchar(500),
        sentAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_nls_newsletter (newsletterId),
        KEY idx_nls_email (email)
      )`,
      "email_newsletter_sends"
    );

    await run(
      c,
      `CREATE TABLE IF NOT EXISTS email_newsletter_snippets (
        id int AUTO_INCREMENT NOT NULL,
        name varchar(255) NOT NULL,
        bodyHtml text NOT NULL,
        createdByUserId int,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      )`,
      "email_newsletter_snippets"
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
