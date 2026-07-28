/**
 * Weekly pattern insight emails (Sunday ~9:05 AM America/Denver).
 * Respects habit_notification_prefs.weeklyInsightEmailEnabled.
 */
import { eq, and, sql, isNotNull } from "drizzle-orm";
import { getDb } from "./db";
import {
  users,
  habitNotificationPrefs,
  habitCronRuns,
  userHabits,
} from "../drizzle/schema";
import { todayMountainDateStr, nowMountain } from "../lib/mountainTime";
import { computeWeeklyInsight } from "./habitInsights";
import { sendTransactionalEmail } from "./notifications";

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL ||
    "https://mindandbodyresetcoach.com"
  ).replace(/\/$/, "");
}

export async function processWeeklyInsightEmails(options?: { force?: boolean }) {
  const db = await getDb();
  if (!db) return { success: false as const, sent: 0, message: "No DB" };

  const todayStr = todayMountainDateStr();
  // Week id = the Sunday dateStr (or force today's date as key)
  const kind = "weekly_insight_email";

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS habit_cron_runs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kind VARCHAR(64) NOT NULL,
        dateStr VARCHAR(10) NOT NULL,
        sentCount INT NOT NULL DEFAULT 0,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY habit_cron_runs_kind_date (kind, dateStr)
      )
    `);
  } catch {
    /* ignore */
  }

  if (!options?.force) {
    const existing = await db
      .select()
      .from(habitCronRuns)
      .where(and(eq(habitCronRuns.kind, kind), eq(habitCronRuns.dateStr, todayStr)))
      .limit(1);
    if (existing.length > 0) {
      return {
        success: true as const,
        sent: 0,
        message: "Already sent weekly insights today",
        skipped: true as const,
      };
    }
    try {
      await db.insert(habitCronRuns).values({ kind, dateStr: todayStr, sentCount: 0 });
    } catch {
      return {
        success: true as const,
        sent: 0,
        message: "Race lost weekly insight",
        skipped: true as const,
      };
    }
  }

  // Users with email + active habits
  const candidates = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(isNotNull(users.email));

  let sent = 0;
  for (const user of candidates) {
    if (!user.email) continue;

    const [prefs] = await db
      .select()
      .from(habitNotificationPrefs)
      .where(eq(habitNotificationPrefs.userId, user.id))
      .limit(1);
    if (prefs && prefs.weeklyInsightEmailEnabled === false) continue;

    const habits = await db
      .select()
      .from(userHabits)
      .where(and(eq(userHabits.userId, user.id), eq(userHabits.isActive, true)))
      .limit(1);
    if (habits.length === 0) continue;

    let insight;
    try {
      insight = await computeWeeklyInsight(db, user.id);
    } catch {
      continue;
    }

    // Skip totally silent users
    if (insight.weekCompletedDays === 0 && insight.lastWeekCompletedDays === 0) {
      continue;
    }

    const firstName = (user.name || "").split(" ")[0] || "friend";
    const html = `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2d3b2d;">
        <p style="font-size: 14px; color: #8a9a8a; text-transform: uppercase; letter-spacing: 0.08em;">Weekly pattern</p>
        <h1 style="font-size: 26px; line-height: 1.25;">${insight.headline}</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #4a5a4a;">Hi ${firstName},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #4a5a4a;">${insight.body}</p>
        <p style="font-size: 16px; line-height: 1.6; font-weight: 600;">${insight.tip}</p>
        <p style="margin-top: 28px;">
          <a href="${siteUrl()}/habit-tracker"
             style="background:#c9a96e;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold;font-family:sans-serif;font-size:14px;">
            Open your tracker
          </a>
        </p>
        <p style="font-size: 12px; color: #9aa; margin-top: 32px;">
          You're getting this because weekly pattern emails are on in your habit tracker profile.
          You can turn them off anytime under Profile → Notifications.
        </p>
      </div>
    `;

    const ok = await sendTransactionalEmail({
      to: user.email,
      toName: user.name || firstName,
      subject: `${insight.headline} · your week in patterns`,
      htmlBody: html,
      textBody: `${insight.headline}\n\n${insight.body}\n\n${insight.tip}\n\n${siteUrl()}/habit-tracker`,
    });
    if (ok) sent++;
  }

  await db
    .update(habitCronRuns)
    .set({ sentCount: sent })
    .where(and(eq(habitCronRuns.kind, kind), eq(habitCronRuns.dateStr, todayStr)));

  return {
    success: true as const,
    sent,
    message: `Weekly insight emails sent: ${sent}`,
  };
}

/** Sunday 9:05–9:12 AM Mountain */
export function isWeeklyInsightEmailWindow(nowLocal = nowMountain()): boolean {
  // nowMountain: "YYYY-MM-DDTHH:MM"
  const datePart = nowLocal.slice(0, 10);
  const hour = Number(nowLocal.slice(11, 13));
  const minute = Number(nowLocal.slice(14, 16));
  const d = new Date(`${datePart}T12:00:00`);
  const isSunday = d.getUTCDay() === 0; // careful: this uses local parse
  // Use Intl for weekday in Mountain
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    weekday: "short",
  }).format(new Date());
  const sunday = weekday === "Sun";
  return sunday && hour === 9 && minute >= 5 && minute <= 12;
}
