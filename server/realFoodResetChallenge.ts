import crypto from "crypto";
import { and, eq, or } from "drizzle-orm";
import {
  challenges,
  userChallengeJournals,
  userChallengeLogs,
  userChallenges,
  users,
} from "../drizzle/schema";
import {
  REAL_FOOD_RESET,
  REAL_FOOD_RESET_GUIDES,
  REAL_FOOD_RESET_THEME,
  realFoodResetDayForDate,
  type RealFoodResetDay,
} from "@shared/realFoodReset";
import { getDb } from "./db";
import { todayMountainDateStr } from "../lib/mountainTime";

function newClaimToken() {
  return crypto.randomBytes(24).toString("hex");
}

function normEmail(email: string) {
  return email.toLowerCase().trim();
}

export async function ensureRealFoodResetChallenge() {
  const db = await getDb();
  if (!db) throw new Error("DB Error");

  const [existing] = await db
    .select()
    .from(challenges)
    .where(eq(challenges.themeTag, REAL_FOOD_RESET_THEME))
    .limit(1);

  const values = {
    title: REAL_FOOD_RESET.name,
    description:
      "Five days of real food skills — lives Mon/Wed/Fri at 12:00 pm Mountain. Progress, not perfection.",
    durationDays: 5,
    startDate: REAL_FOOD_RESET.startDate,
    endDate: REAL_FOOD_RESET.endDate,
    themeTag: REAL_FOOD_RESET_THEME,
    isFeatured: true,
    featuredOrder: 1,
    isActive: true,
  };

  if (existing) {
    await db.update(challenges).set(values).where(eq(challenges.id, existing.id));
    return existing.id;
  }

  const [res] = await db.insert(challenges).values(values);
  return res.insertId;
}

export async function enrollRealFoodResetByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("DB Error");
  const challengeId = await ensureRealFoodResetChallenge();
  const normalized = normEmail(email);

  const [existing] = await db
    .select()
    .from(userChallenges)
    .where(
      and(eq(userChallenges.challengeId, challengeId), eq(userChallenges.email, normalized))
    )
    .limit(1);

  if (existing) {
    let token = existing.claimToken;
    if (!token) {
      token = newClaimToken();
      await db
        .update(userChallenges)
        .set({ claimToken: token })
        .where(eq(userChallenges.id, existing.id));
    }
    return { challengeId, userChallengeId: existing.id, claimToken: token };
  }

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, normalized)).limit(1);

  const token = newClaimToken();
  const [res] = await db.insert(userChallenges).values({
    challengeId,
    email: normalized,
    userId: user?.id ?? null,
    claimToken: token,
    startDate: REAL_FOOD_RESET.startDate,
    status: "active",
  });

  return { challengeId, userChallengeId: res.insertId, claimToken: token };
}

export async function claimRealFoodResetEnrollment(opts: {
  token: string;
  deviceId?: string | null;
  userId?: number | null;
  email?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB Error");
  const token = opts.token.trim();
  if (!token) return { success: false as const };

  const [row] = await db
    .select()
    .from(userChallenges)
    .where(eq(userChallenges.claimToken, token))
    .limit(1);
  if (!row) return { success: false as const };

  const patch: Partial<typeof userChallenges.$inferInsert> = {};
  if (opts.deviceId && !row.deviceId) patch.deviceId = opts.deviceId;
  if (opts.userId && !row.userId) patch.userId = opts.userId;
  if (opts.email && !row.email) patch.email = normEmail(opts.email);
  if (Object.keys(patch).length > 0) {
    await db.update(userChallenges).set(patch).where(eq(userChallenges.id, row.id));
  }
  return { success: true as const, challengeId: row.challengeId, userChallengeId: row.id };
}

export async function findEnrollment(opts: {
  challengeId?: number;
  userId?: number | null;
  deviceId?: string | null;
  email?: string | null;
}) {
  const db = await getDb();
  if (!db) return null;

  const challengeId = opts.challengeId ?? (await ensureRealFoodResetChallenge());
  const clauses = [];
  if (opts.userId) clauses.push(eq(userChallenges.userId, opts.userId));
  if (opts.deviceId) clauses.push(eq(userChallenges.deviceId, opts.deviceId));
  if (opts.email) clauses.push(eq(userChallenges.email, normEmail(opts.email)));
  if (clauses.length === 0) return null;

  const [row] = await db
    .select()
    .from(userChallenges)
    .where(and(eq(userChallenges.challengeId, challengeId), or(...clauses)))
    .limit(1);
  return row ?? null;
}

export async function mergeRealFoodResetToUser(userId: number, email: string | null, deviceId?: string | null) {
  const db = await getDb();
  if (!db) return;
  const challengeId = await ensureRealFoodResetChallenge();
  const clauses = [];
  if (deviceId) clauses.push(eq(userChallenges.deviceId, deviceId));
  if (email) clauses.push(eq(userChallenges.email, normEmail(email)));
  if (clauses.length === 0) return;

  await db
    .update(userChallenges)
    .set({ userId, deviceId: null })
    .where(and(eq(userChallenges.challengeId, challengeId), or(...clauses)));
}

export type ChallengeTodayPayload = {
  enrolled: boolean;
  challengeId: number | null;
  userChallengeId: number | null;
  title: string;
  startsOn: string;
  endsOn: string;
  beforeStart: boolean;
  afterEnd: boolean;
  today: (RealFoodResetDay & { done: boolean }) | null;
  meetUrl: string | null;
  videoUrl: string | null;
  journal: { noticed: string; glad: string; hard: string } | null;
  guides: typeof REAL_FOOD_RESET_GUIDES | null;
};

export async function getChallengeToday(opts: {
  userId?: number | null;
  deviceId?: string | null;
  email?: string | null;
}): Promise<ChallengeTodayPayload> {
  const db = await getDb();
  const empty: ChallengeTodayPayload = {
    enrolled: false,
    challengeId: null,
    userChallengeId: null,
    title: REAL_FOOD_RESET.name,
    startsOn: REAL_FOOD_RESET.startDate,
    endsOn: REAL_FOOD_RESET.endDate,
    beforeStart: false,
    afterEnd: false,
    today: null,
    meetUrl: null,
    videoUrl: null,
    journal: null,
    guides: null,
  };
  if (!db) return empty;

  const challengeId = await ensureRealFoodResetChallenge();
  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
  const enrollment = await findEnrollment({ challengeId, ...opts });
  const todayStr = todayMountainDateStr();
  const beforeStart = todayStr < REAL_FOOD_RESET.startDate;
  const afterEnd = todayStr > REAL_FOOD_RESET.endDate;
  const day = realFoodResetDayForDate(todayStr);

  if (!enrollment) {
    return { ...empty, challengeId, beforeStart, afterEnd };
  }

  let done = false;
  if (day) {
    const [log] = await db
      .select()
      .from(userChallengeLogs)
      .where(
        and(
          eq(userChallengeLogs.userChallengeId, enrollment.id),
          eq(userChallengeLogs.dateStr, day.dateStr)
        )
      )
      .limit(1);
    done = !!log;
  }

  const [journalRow] = day
    ? await db
        .select()
        .from(userChallengeJournals)
        .where(
          and(
            eq(userChallengeJournals.userChallengeId, enrollment.id),
            eq(userChallengeJournals.dateStr, day.dateStr)
          )
        )
        .limit(1)
    : [undefined];

  const showMeet = !!(enrollment && day?.format === "live" && challenge?.meetUrl);

  return {
    enrolled: true,
    challengeId,
    userChallengeId: enrollment.id,
    title: REAL_FOOD_RESET.name,
    startsOn: REAL_FOOD_RESET.startDate,
    endsOn: REAL_FOOD_RESET.endDate,
    beforeStart,
    afterEnd,
    today: day ? { ...day, done } : null,
    meetUrl: showMeet ? challenge!.meetUrl! : null,
    videoUrl: null,
    journal: journalRow
      ? {
          noticed: journalRow.noticed || "",
          glad: journalRow.glad || "",
          hard: journalRow.hard || "",
        }
      : { noticed: "", glad: "", hard: "" },
    guides: REAL_FOOD_RESET_GUIDES,
  };
}

/** Logging a meal or saving the journal counts as today's challenge check-in. */
export async function creditChallengeDayFromActivity(opts: {
  userId?: number | null;
  email?: string | null;
  deviceId?: string | null;
  userChallengeId?: number | null;
  dateStr: string;
}) {
  if (!realFoodResetDayForDate(opts.dateStr)) return { credited: false as const };

  const db = await getDb();
  if (!db) return { credited: false as const };

  let enrollmentId = opts.userChallengeId ?? null;
  if (!enrollmentId) {
    const challengeId = await ensureRealFoodResetChallenge();
    const match = [];
    if (opts.userId) match.push(eq(userChallenges.userId, opts.userId));
    if (opts.email) match.push(eq(userChallenges.email, normEmail(opts.email)));
    if (opts.deviceId) match.push(eq(userChallenges.deviceId, opts.deviceId));
    if (match.length === 0) return { credited: false as const };
    const [row] = await db
      .select({ id: userChallenges.id })
      .from(userChallenges)
      .where(and(eq(userChallenges.challengeId, challengeId), or(...match)))
      .limit(1);
    enrollmentId = row?.id ?? null;
  }
  if (!enrollmentId) return { credited: false as const };

  const [existing] = await db
    .select({ id: userChallengeLogs.id })
    .from(userChallengeLogs)
    .where(
      and(
        eq(userChallengeLogs.userChallengeId, enrollmentId),
        eq(userChallengeLogs.dateStr, opts.dateStr)
      )
    )
    .limit(1);
  if (existing) return { credited: true as const, already: true as const };

  await db.insert(userChallengeLogs).values({
    userChallengeId: enrollmentId,
    dateStr: opts.dateStr,
  });
  return { credited: true as const, already: false as const };
}
