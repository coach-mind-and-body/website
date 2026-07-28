/**
 * Day-3 re-engage: users who first opened ~3 days ago with low activity.
 * Once per Denver day via habit_cron_runs kind=day3.
 */
import { getDb } from "./db";
import {
  habitCronRuns,
  habitFunnelEvents,
  habitNotificationPrefs,
  pushSubscriptions,
  userHabitLogs,
  userHabits,
} from "../drizzle/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { todayMountainDateStr, nowMountain } from "../lib/mountainTime";
import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = "mailto:info@coachmindandbody.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

function addDaysStr(dateStr: string, delta: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function processDay3Reengage(options?: { force?: boolean }) {
  const db = await getDb();
  if (!db) return { success: false as const, sent: 0, message: "No DB" };

  const todayStr = todayMountainDateStr();
  const targetOpenDate = addDaysStr(todayStr, -3);

  // Claim day
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
      .where(and(eq(habitCronRuns.kind, "day3"), eq(habitCronRuns.dateStr, todayStr)))
      .limit(1);
    if (existing.length > 0) {
      return { success: true as const, sent: 0, message: "Already ran day3", skipped: true as const };
    }
    try {
      await db.insert(habitCronRuns).values({ kind: "day3", dateStr: todayStr, sentCount: 0 });
    } catch {
      return { success: true as const, sent: 0, message: "Race lost day3", skipped: true as const };
    }
  }

  // first_open on target date
  const firstOpens = await db
    .select()
    .from(habitFunnelEvents)
    .where(
      and(
        eq(habitFunnelEvents.eventType, "first_open"),
        eq(habitFunnelEvents.dateStr, targetOpenDate)
      )
    );

  const userIds = Array.from(
    new Set(firstOpens.map((e) => e.userId).filter((id): id is number => id != null))
  );

  let sent = 0;
  const payload = JSON.stringify({
    title: "Still with me?",
    body: "One win today is enough. Open your tracker and vote for future you.",
    url: "/habit-tracker",
    icon: "/favicon.ico",
  });

  for (const userId of userIds) {
    const [prefs] = await db
      .select()
      .from(habitNotificationPrefs)
      .where(eq(habitNotificationPrefs.userId, userId))
      .limit(1);
    if (prefs && prefs.day1Day3Enabled === false) continue;

    // Low activity: 0–1 distinct complete days since first open
    const logs = await db
      .select()
      .from(userHabitLogs)
      .where(
        and(
          eq(userHabitLogs.userId, userId),
          gte(userHabitLogs.dateStr, targetOpenDate),
          lte(userHabitLogs.dateStr, todayStr),
          eq(userHabitLogs.completed, true)
        )
      );
    const days = new Set(logs.map((l) => l.dateStr));
    if (days.size > 1) continue;

    const habits = await db
      .select()
      .from(userHabits)
      .where(and(eq(userHabits.userId, userId), eq(userHabits.isActive, true)));
    if (habits.length === 0) continue;

    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
    if (subs.length === 0) continue;

    try {
      await webpush.sendNotification(
        {
          endpoint: subs[0].endpoint,
          keys: { p256dh: subs[0].p256dh, auth: subs[0].auth },
        },
        payload
      );
      sent++;
      await db.insert(habitFunnelEvents).values({
        userId,
        eventType: "day3_return",
        dateStr: todayStr,
        meta: "push_sent",
      });
    } catch (err) {
      console.warn("[Day3] push failed", userId, err);
    }
  }

  await db
    .update(habitCronRuns)
    .set({ sentCount: sent })
    .where(and(eq(habitCronRuns.kind, "day3"), eq(habitCronRuns.dateStr, todayStr)));

  return {
    success: true as const,
    sent,
    message: `Day3 re-engage sent ${sent} (open date ${targetOpenDate})`,
  };
}

/** Morning window 9:00–9:05 MT for day-3 */
export function isDay3Window(nowLocal = nowMountain()): boolean {
  const hour = Number(nowLocal.slice(11, 13));
  const minute = Number(nowLocal.slice(14, 16));
  return hour === 9 && minute <= 5;
}
