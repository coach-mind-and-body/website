import { getDb } from "./db";
import { pushSubscriptions, userHabits, userHabitLogs, habitReminderRuns } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { todayMountainDateStr, nowMountain } from "../lib/mountainTime";
import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = "mailto:info@coachmindandbody.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

/** Ensure durable dedupe table exists (safe if already migrated). */
async function ensureReminderRunsTable(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS habit_reminder_runs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dateStr VARCHAR(10) NOT NULL,
      sentCount INT NOT NULL DEFAULT 0,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY habit_reminder_runs_dateStr (dateStr)
    )
  `);
}

/**
 * Claim today's run before sending (unique dateStr). Returns false if another process already claimed.
 */
async function claimTodaysRun(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  todayStr: string,
  force?: boolean
): Promise<{ claimed: boolean; runId?: number }> {
  if (force) {
    const existing = await db
      .select({ id: habitReminderRuns.id })
      .from(habitReminderRuns)
      .where(eq(habitReminderRuns.dateStr, todayStr))
      .limit(1);
    if (existing.length > 0) {
      return { claimed: true, runId: existing[0].id };
    }
    const [result] = await db.insert(habitReminderRuns).values({ dateStr: todayStr, sentCount: 0 });
    return { claimed: true, runId: Number((result as any)?.insertId) || undefined };
  }

  try {
    const [result] = await db.insert(habitReminderRuns).values({ dateStr: todayStr, sentCount: 0 });
    return { claimed: true, runId: Number((result as any)?.insertId) || undefined };
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (msg.includes("Duplicate") || err?.code === "ER_DUP_ENTRY") {
      return { claimed: false };
    }
    throw err;
  }
}

/**
 * Send evening habit reminders to users who:
 * - have a push subscription (with userId)
 * - have ≥1 active habit
 * - have not completed any active habit today (America/Denver)
 *
 * Durable once-per-day via habit_reminder_runs.dateStr unique row (claim-before-send).
 */
export async function processHabitReminders(options?: { force?: boolean }) {
  const db = await getDb();
  if (!db) return { success: false as const, message: "No DB", sent: 0, removed: 0 };

  const todayStr = todayMountainDateStr();

  try {
    await ensureReminderRunsTable(db);
  } catch (err) {
    console.warn("[Cron] Could not ensure habit_reminder_runs table:", err);
  }

  let runId: number | undefined;
  try {
    const claim = await claimTodaysRun(db, todayStr, options?.force);
    if (!claim.claimed) {
      return {
        success: true as const,
        message: `Already ran habit reminders for ${todayStr}.`,
        sent: 0,
        removed: 0,
        skipped: true as const,
      };
    }
    runId = claim.runId;
  } catch (err) {
    console.warn("[Cron] Claim failed, proceeding without durable lock:", err);
  }

  console.log(`[Cron] Running habit reminders for ${todayStr} (Mountain now: ${nowMountain()})...`);

  const allSubs = await db.select().from(pushSubscriptions);
  if (allSubs.length === 0) {
    if (runId) {
      await db.update(habitReminderRuns).set({ sentCount: 0 }).where(eq(habitReminderRuns.id, runId));
    }
    return { success: true as const, message: "No push subscriptions found.", sent: 0, removed: 0 };
  }

  let sent = 0;
  const failed: number[] = [];

  const subsByUser = new Map<number, typeof allSubs>();
  for (const sub of allSubs) {
    if (sub.userId == null) continue;
    if (!subsByUser.has(sub.userId)) subsByUser.set(sub.userId, []);
    subsByUser.get(sub.userId)!.push(sub);
  }

  const allActiveHabits = await db.select().from(userHabits).where(eq(userHabits.isActive, true));
  const allTodayLogs = await db
    .select()
    .from(userHabitLogs)
    .where(and(eq(userHabitLogs.dateStr, todayStr), eq(userHabitLogs.completed, true)));

  const activeHabitsByUser = new Map<number, number[]>();
  for (const h of allActiveHabits) {
    if (!activeHabitsByUser.has(h.userId)) activeHabitsByUser.set(h.userId, []);
    activeHabitsByUser.get(h.userId)!.push(h.id);
  }

  const todayLogsByUser = new Map<number, number[]>();
  for (const l of allTodayLogs) {
    if (!todayLogsByUser.has(l.userId)) todayLogsByUser.set(l.userId, []);
    todayLogsByUser.get(l.userId)!.push(l.userHabitId);
  }

  const payload = JSON.stringify({
    title: "Quick habit check-in",
    body: "Take 30 seconds to log today's habits when you're ready. Small steps add up.",
    url: "/habit-tracker",
    icon: "/favicon.ico",
  });

  for (const [userId, subs] of Array.from(subsByUser.entries())) {
    const activeIds = activeHabitsByUser.get(userId) || [];
    if (activeIds.length === 0) continue;

    const completedIds = todayLogsByUser.get(userId) || [];
    const hasCompletedAnyActiveHabit = activeIds.some((id) => completedIds.includes(id));
    if (hasCompletedAnyActiveHabit) continue;

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (err: any) {
        console.warn(`[Cron Push] Failed to send to sub ${sub.id}:`, err.statusCode || err.message);
        if (err.statusCode === 410 || err.statusCode === 404) {
          failed.push(sub.id);
        }
      }
    }
  }

  if (failed.length > 0) {
    for (const id of failed) {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id));
    }
  }

  if (runId) {
    try {
      await db.update(habitReminderRuns).set({ sentCount: sent }).where(eq(habitReminderRuns.id, runId));
    } catch (err) {
      console.warn("[Cron] Failed to update sentCount:", err);
    }
  }

  return {
    success: true as const,
    message: `Cron complete. Sent ${sent} reminders. Removed ${failed.length} dead subs.`,
    sent,
    removed: failed.length,
  };
}

/**
 * True when Mountain Time is in the 8:00–8:14 PM window (catches 1-minute pollers).
 */
export function isHabitReminderWindow(nowLocal = nowMountain()): boolean {
  const hour = Number(nowLocal.slice(11, 13));
  const minute = Number(nowLocal.slice(14, 16));
  return hour === 20 && minute < 15;
}
