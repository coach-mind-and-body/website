import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { clientIntakes, type InsertClientIntake } from "../drizzle/schema";
import type { ClientIntakeInput } from "@shared/clientIntake";

const CREATE_CLIENT_INTAKES = `
CREATE TABLE IF NOT EXISTS \`client_intakes\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`name\` varchar(200) NOT NULL,
  \`phone\` varchar(40) NOT NULL,
  \`email\` varchar(320) NOT NULL,
  \`goals\` text NOT NULL,
  \`health1\` varchar(500) NOT NULL,
  \`health2\` varchar(500) NOT NULL,
  \`health3\` varchar(500) NOT NULL,
  \`habitsWorse\` text NOT NULL,
  \`habitsBetter\` text NOT NULL,
  \`activity\` text NOT NULL,
  \`menopause\` enum('premenopausal','perimenopausal','postmenopausal') NOT NULL,
  \`lastCycle\` varchar(40),
  \`allergies\` text NOT NULL,
  \`source\` enum('link','portal') NOT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`client_intakes_id\` PRIMARY KEY(\`id\`),
  KEY \`client_intakes_email\` (\`email\`),
  KEY \`client_intakes_created\` (\`createdAt\`)
)
`;

let tableReady: Promise<void> | null = null;

async function ensureClientIntakesTable(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  if (!tableReady) {
    tableReady = db
      .execute(sql.raw(CREATE_CLIENT_INTAKES))
      .then(() => undefined)
      .catch((err) => {
        tableReady = null;
        throw err;
      });
  }
  await tableReady;
}

function toRow(input: ClientIntakeInput, source: "link" | "portal"): InsertClientIntake {
  return {
    name: input.name,
    phone: input.phone,
    email: input.email,
    goals: input.goals,
    health1: input.health1,
    health2: input.health2,
    health3: input.health3,
    habitsWorse: input.habitsWorse,
    habitsBetter: input.habitsBetter,
    activity: input.activity,
    menopause: input.menopause,
    lastCycle: input.lastCycle ?? null,
    allergies: input.allergies,
    source,
  };
}

export async function saveClientIntake(
  input: ClientIntakeInput,
  source: "link" | "portal"
): Promise<{ id: number; created: boolean }> {
  const db = await getDb();
  if (!db) {
    throw new Error("We couldn't save this intake. Please try again in a moment.");
  }

  try {
    await ensureClientIntakesTable(db);
    const [existing] = await db
      .select({ id: clientIntakes.id })
      .from(clientIntakes)
      .where(eq(clientIntakes.email, input.email))
      .orderBy(desc(clientIntakes.createdAt))
      .limit(1);
    const row = toRow(input, source);
    if (existing) {
      await db.update(clientIntakes).set(row).where(eq(clientIntakes.id, existing.id));
      return { id: existing.id, created: false };
    }
    const inserted = await db.insert(clientIntakes).values(row).$returningId();
    return { id: inserted[0]?.id ?? 0, created: true };
  } catch (err) {
    console.error("[Intake] Failed to save intake for", input.email, err);
    throw new Error("We couldn't save this intake. Please try again in a moment.");
  }
}

export async function listClientIntakes() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await ensureClientIntakesTable(db);
  return db.select().from(clientIntakes).orderBy(desc(clientIntakes.createdAt)).limit(200);
}

export async function deleteClientIntake(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await ensureClientIntakesTable(db);
  await db.delete(clientIntakes).where(eq(clientIntakes.id, id));
}
