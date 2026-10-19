import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { holidayApplications, type InsertHolidayApplication } from "../drizzle/schema";
import type { HolidayApplicationInput } from "@shared/holidayCoaching";

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
  CONSTRAINT \`holiday_applications_id\` PRIMARY KEY(\`id\`),
  KEY \`holiday_applications_email\` (\`email\`),
  KEY \`holiday_applications_created\` (\`createdAt\`)
)
`;

let tableReady: Promise<void> | null = null;

async function ensureHolidayApplicationsTable(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>
) {
  if (!tableReady) {
    tableReady = db
      .execute(sql.raw(CREATE_HOLIDAY_APPLICATIONS))
      .then(() => undefined)
      .catch((err) => {
        tableReady = null;
        throw err;
      });
  }
  await tableReady;
}

export async function saveHolidayApplication(input: HolidayApplicationInput): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("We couldn't save your application. Please try again in a moment.");
  }

  const values: InsertHolidayApplication = {
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    age18: input.age18,
    newToFasting: input.newToFasting,
    pregnantOrBreastfeeding: input.pregnantOrBreastfeeding,
    eatingDisorder: input.eatingDisorder,
    addiction: input.addiction,
    twelveStep: input.twelveStep,
    moodMedication: input.moodMedication,
    takeResponsibility: input.takeResponsibility,
    whyCoaching: input.whyCoaching,
    hopes: input.hopes,
    buyKetoMojo: input.buyKetoMojo,
    logFood: input.logFood,
    commitFiveWeeks: input.commitFiveWeeks,
    weeklyZoom: input.weeklyZoom,
    actionSteps: input.actionSteps,
    availableNov3to8: input.availableNov3to8,
    utmSource: input.utmSource ?? null,
    utmMedium: input.utmMedium ?? null,
    utmCampaign: input.utmCampaign ?? null,
    utmContent: input.utmContent ?? null,
    utmTerm: input.utmTerm ?? null,
    fbclid: input.fbclid ?? null,
    fbp: input.fbp ?? null,
    fbc: input.fbc ?? null,
    landingUrl: input.landingUrl ?? null,
    eventId: input.eventId,
  };

  try {
    await ensureHolidayApplicationsTable(db);
    await db.insert(holidayApplications).values(values);
  } catch (err) {
    console.error("[Holiday] Failed to save application for", input.email, err);
    throw new Error("We couldn't save your application. Please try again in a moment.");
  }
}
