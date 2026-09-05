import { and, eq, inArray, sql } from "drizzle-orm";
import webpush from "web-push";
import {
  challenges,
  pushSubscriptions,
  userChallengeLogs,
  userChallenges,
  users,
} from "../drizzle/schema";
import {
  REAL_FOOD_RESET,
  REAL_FOOD_RESET_THEME,
  realFoodResetDayForDate,
} from "@shared/realFoodReset";
import { getDb } from "./db";
import { nowMountain, todayMountainDateStr } from "../lib/mountainTime";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = "mailto:info@coachmindandbody.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export type ChallengePushKind = "morning" | "live" | "evening" | "eve-before";

function inMinuteWindow(hour: number, startMinute: number, nowLocal = nowMountain()): boolean {
  const h = Number(nowLocal.slice(11, 13));
  const m = Number(nowLocal.slice(14, 16));
  return h === hour && m >= startMinute && m <= startMinute + 2;
}

export function challengePushKindNow(nowLocal = nowMountain()): ChallengePushKind | null {
  const dateStr = nowLocal.slice(0, 10);
  const day = realFoodResetDayForDate(dateStr);

  if (dateStr === REAL_FOOD_RESET.startDate) {
    // fall through — still a challenge day
  } else if (!day) {
    const eveBefore = shiftDateStr(REAL_FOOD_RESET.startDate, -1);
    if (dateStr === eveBefore && inMinuteWindow(19, 0, nowLocal)) return "eve-before";
    return null;
  }

  if (!day) return null;
  if (inMinuteWindow(8, 0, nowLocal)) return "morning";
  if (day.format === "live" && inMinuteWindow(11, 45, nowLocal)) return "live";
  if (inMinuteWindow(19, 0, nowLocal)) return "evening";
  return null;
}

function shiftDateStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function payloadFor(kind: ChallengePushKind, dateStr: string): { title: string; body: string; url: string } {
  const day = realFoodResetDayForDate(dateStr);
  const url = "/habit-tracker";
  if (kind === "eve-before") {
    return {
      title: `${REAL_FOOD_RESET.shortName} starts tomorrow`,
      body: `We begin ${REAL_FOOD_RESET.startLabel}. Lives are ${REAL_FOOD_RESET.liveDays} at ${REAL_FOOD_RESET.liveTime}. Open the app.`,
      url,
    };
  }
  if (kind === "morning" && day) {
    return {
      title: `Day ${day.n}: ${day.title}`,
      body: `${day.formatLabel}. Log your food and jot a few lines in the journal — progress, not perfection.`,
      url,
    };
  }
  if (kind === "live" && day) {
    return {
      title: "We're live in 15 minutes",
      body: `Join ${REAL_FOOD_RESET.shortName} from the app — ${REAL_FOOD_RESET.liveTime}.`,
      url,
    };
  }
  return {
    title: "Evening check-in",
    body: "Log a meal or write three lines in your journal. That counts as today.",
    url,
  };
}

async function ensureRunsTable(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS challenge_push_runs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dateStr VARCHAR(10) NOT NULL,
      kind VARCHAR(32) NOT NULL,
      sentCount INT NOT NULL DEFAULT 0,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY challenge_push_runs_date_kind (dateStr, kind)
    )
  `);
}

const lastKindInProcess = new Map<string, ChallengePushKind>();

export async function processChallengePushes(options?: { force?: boolean; kind?: ChallengePushKind }) {
  const db = await getDb();
  if (!db) return { success: false as const, message: "No DB", sent: 0 };

  const nowLocal = nowMountain();
  const dateStr = todayMountainDateStr();
  const kind = options?.kind ?? challengePushKindNow(nowLocal);
  if (!kind) {
    return { success: true as const, message: "Not in a challenge push window.", sent: 0, skipped: true as const };
  }

  const processKey = `${dateStr}:${kind}`;
  if (!options?.force && lastKindInProcess.get(dateStr) === kind) {
    return { success: true as const, message: `Already sent ${kind} in this process.`, sent: 0, skipped: true as const };
  }

  try {
    await ensureRunsTable(db);
  } catch (err) {
    console.error("[Challenge Push] Could not ensure runs table:", err);
    return { success: false as const, message: "No lock table", sent: 0 };
  }

  try {
    await db.execute(sql`
      INSERT INTO challenge_push_runs (dateStr, kind, sentCount)
      VALUES (${dateStr}, ${kind}, 0)
    `);
  } catch (err: unknown) {
    const msg = String((err as { message?: string })?.message || err);
    const code = (err as { code?: string })?.code;
    if (!options?.force && (msg.includes("Duplicate") || code === "ER_DUP_ENTRY")) {
      lastKindInProcess.set(dateStr, kind);
      return { success: true as const, message: `Already ran ${kind} for ${dateStr}.`, sent: 0, skipped: true as const };
    }
    if (!msg.includes("Duplicate") && code !== "ER_DUP_ENTRY") {
      throw err;
    }
  }

  lastKindInProcess.set(dateStr, kind);

  const [challenge] = await db
    .select({ id: challenges.id })
    .from(challenges)
    .where(eq(challenges.themeTag, REAL_FOOD_RESET_THEME))
    .limit(1);
  if (!challenge) {
    return { success: true as const, message: "Challenge not seeded.", sent: 0 };
  }

  const enrollments = await db
    .select({
      id: userChallenges.id,
      userId: userChallenges.userId,
      email: userChallenges.email,
      deviceId: userChallenges.deviceId,
    })
    .from(userChallenges)
    .where(eq(userChallenges.challengeId, challenge.id));

  const emailSet = [
    ...new Set(enrollments.map((e) => e.email).filter((e): e is string => Boolean(e))),
  ];
  const usersByEmail = new Map<string, number>();
  if (emailSet.length > 0) {
    const rows = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(inArray(users.email, emailSet));
    for (const u of rows) {
      if (u.email) usersByEmail.set(u.email.toLowerCase(), u.id);
    }
  }

  const userIds = new Set<number>();
  for (const e of enrollments) {
    if (e.userId) userIds.add(e.userId);
    if (e.email && usersByEmail.has(e.email.toLowerCase())) {
      userIds.add(usersByEmail.get(e.email.toLowerCase())!);
    }
  }

  if (userIds.size === 0 && enrollments.every((e) => !e.deviceId)) {
    return { success: true as const, message: "No enrolled accounts to notify.", sent: 0 };
  }

  const skipUserIds = new Set<number>();
  const skipDeviceIds = new Set<string>();
  if (kind === "evening" && enrollments.length > 0) {
    const logs = await db
      .select({ userChallengeId: userChallengeLogs.userChallengeId })
      .from(userChallengeLogs)
      .where(
        and(
          inArray(
            userChallengeLogs.userChallengeId,
            enrollments.map((e) => e.id)
          ),
          eq(userChallengeLogs.dateStr, dateStr)
        )
      );
    const doneEnrollment = new Set(logs.map((l) => l.userChallengeId));
    for (const e of enrollments) {
      if (!doneEnrollment.has(e.id)) continue;
      if (e.userId) skipUserIds.add(e.userId);
      if (e.email && usersByEmail.has(e.email.toLowerCase())) {
        skipUserIds.add(usersByEmail.get(e.email.toLowerCase())!);
      }
      if (e.deviceId) skipDeviceIds.add(e.deviceId);
    }
  }

  const idList = Array.from(userIds);
  const deviceIds = [
    ...new Set(enrollments.map((e) => e.deviceId).filter((d): d is string => Boolean(d))),
  ];
  const subsByUser =
    idList.length > 0
      ? await db.select().from(pushSubscriptions).where(inArray(pushSubscriptions.userId, idList))
      : [];
  const subsByDevice =
    deviceIds.length > 0
      ? await db.select().from(pushSubscriptions).where(inArray(pushSubscriptions.deviceId, deviceIds))
      : [];
  const seenEndpoints = new Set<string>();
  const subs = [...subsByUser, ...subsByDevice].filter((s) => {
    if (seenEndpoints.has(s.endpoint)) return false;
    seenEndpoints.add(s.endpoint);
    return true;
  });

  const copy = payloadFor(kind, dateStr);
  const payload = JSON.stringify({
    title: copy.title,
    body: copy.body,
    url: copy.url,
    icon: "/favicon.ico",
  });

  let sent = 0;
  const failed: number[] = [];
  const sentUsers = new Set<number>();

  for (const sub of subs) {
    if (sub.userId != null && sentUsers.has(sub.userId)) continue;
    if (sub.userId != null && skipUserIds.has(sub.userId)) continue;
    if (sub.deviceId && skipDeviceIds.has(sub.deviceId)) continue;
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      sent++;
      if (sub.userId != null) sentUsers.add(sub.userId);
    } catch (err: unknown) {
      const status = (err as { statusCode?: number })?.statusCode;
      console.warn(`[Challenge Push] Failed sub ${sub.id}:`, status || (err as Error).message);
      if (status === 410 || status === 404) failed.push(sub.id);
    }
  }

  if (failed.length > 0) {
    await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, failed));
  }

  await db.execute(sql`
    UPDATE challenge_push_runs SET sentCount = ${sent}
    WHERE dateStr = ${dateStr} AND kind = ${kind}
  `);

  return {
    success: true as const,
    message: `Challenge ${kind} sent ${sent} (removed ${failed.length} dead).`,
    sent,
    kind,
    dateStr,
  };
}
