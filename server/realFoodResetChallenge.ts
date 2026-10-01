import crypto from "crypto";
import { and, eq, or } from "drizzle-orm";
import { sql } from "drizzle-orm";
import {
  challengeDayVideos,
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
  challengeLiveMeetOpen,
  realFoodResetDayForDate,
  realFoodResetDocuments,
  realFoodResetGuideImages,
  type RealFoodResetDay,
} from "@shared/realFoodReset";
import { getDb } from "./db";
import { nowMountain, todayMountainDateStr } from "../lib/mountainTime";
import { parseReplayToken, replayEmbedUrl, replayWatchUrl } from "@shared/replayVideo";

let dayVideosReady = false;

async function ensureDayVideosTable() {
  if (dayVideosReady) return;
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS challenge_day_videos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      challengeId INT NOT NULL,
      dateStr VARCHAR(10) NOT NULL,
      videoId VARCHAR(255) NOT NULL,
      title VARCHAR(255) NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
      UNIQUE KEY uniq_challenge_day (challengeId, dateStr)
    )
  `);
  try {
    await db.execute(sql`
      ALTER TABLE challenge_day_videos MODIFY COLUMN videoId VARCHAR(255) NOT NULL
    `);
  } catch {
    // already widened, or the table was just created at 255
  }
  dayVideosReady = true;
}

export async function getChallengeDayVideo(challengeId: number, dateStr: string) {
  const db = await getDb();
  if (!db) return null;
  await ensureDayVideosTable();
  const [row] = await db
    .select()
    .from(challengeDayVideos)
    .where(and(eq(challengeDayVideos.challengeId, challengeId), eq(challengeDayVideos.dateStr, dateStr)))
    .limit(1);
  return row ?? null;
}

export async function listChallengeDayVideos(challengeId: number) {
  const db = await getDb();
  if (!db) return [];
  await ensureDayVideosTable();
  return db.select().from(challengeDayVideos).where(eq(challengeDayVideos.challengeId, challengeId));
}

export async function upsertChallengeDayVideo(opts: {
  challengeId: number;
  dateStr: string;
  videoId: string;
  title?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB Error");
  await ensureDayVideosTable();
  const existing = await getChallengeDayVideo(opts.challengeId, opts.dateStr);
  if (existing) {
    await db
      .update(challengeDayVideos)
      .set({ videoId: opts.videoId, title: opts.title ?? existing.title })
      .where(eq(challengeDayVideos.id, existing.id));
    return { ...existing, videoId: opts.videoId, title: opts.title ?? existing.title };
  }
  const [res] = await db.insert(challengeDayVideos).values({
    challengeId: opts.challengeId,
    dateStr: opts.dateStr,
    videoId: opts.videoId,
    title: opts.title ?? null,
  });
  return {
    id: res.insertId,
    challengeId: opts.challengeId,
    dateStr: opts.dateStr,
    videoId: opts.videoId,
    title: opts.title ?? null,
  };
}

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
      `Five days of real food skills — lives Mon/Wed/Fri at ${REAL_FOOD_RESET.liveTime}. Progress, not perfection.`,
    durationDays: 5,
    startDate: REAL_FOOD_RESET.startDate,
    endDate: REAL_FOOD_RESET.endDate,
    themeTag: REAL_FOOD_RESET_THEME,
    meetUrl: REAL_FOOD_RESET.meetUrl,
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

export type ChallengeWeekDay = Omit<RealFoodResetDay, "journal"> & {
  weekdayShort: string;
  done: boolean;
  isToday: boolean;
  isFuture: boolean;
  liveOpen: boolean;
  meetUrl: string | null;
  videoUrl: string | null;
  replayEmbedUrl: string | null;
  prompts: RealFoodResetDay["journal"];
  journal: { noticed: string; glad: string; hard: string };
};

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
  replayVideoId: string | null;
  replayEmbedUrl: string | null;
  liveTime: string;
  journal: { noticed: string; glad: string; hard: string } | null;
  guides: typeof REAL_FOOD_RESET_GUIDES | null;
  guideImages: { title: string; alt: string; url: string }[];
  documents: { title: string; url: string }[];
  previewDays: RealFoodResetDay[];
  week: ChallengeWeekDay[];
};

const WEEKDAY_SHORT = ["M", "T", "W", "T", "F"] as const;

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
    replayVideoId: null,
    replayEmbedUrl: null,
    liveTime: REAL_FOOD_RESET.liveTime,
    journal: null,
    guides: null,
    guideImages: [],
    documents: [],
    previewDays: [...REAL_FOOD_RESET.days],
    week: [],
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

  const replay = await getChallengeDayVideo(challengeId, todayStr);
  const postedReplay = parseReplayToken(replay?.videoId);
  const liveStillOpen = challengeLiveMeetOpen(nowMountain().slice(11, 16), !!postedReplay);
  const showMeet = !!(enrollment && day?.format === "live" && challenge?.meetUrl && liveStillOpen);
  const replaySource = postedReplay || (day?.videoId ? parseReplayToken(day.videoId) : null);
  const documents = [...realFoodResetDocuments()];
  // Old App Store binary only finds Drive replays in this list. New UI hides the duplicate.
  if (postedReplay?.kind === "drive") {
    documents.unshift({
      title: "Watch today's live replay",
      url: replayWatchUrl(postedReplay),
    });
  }

  const [allLogs, allJournals, allVideos] = await Promise.all([
    db
      .select()
      .from(userChallengeLogs)
      .where(eq(userChallengeLogs.userChallengeId, enrollment.id)),
    db
      .select()
      .from(userChallengeJournals)
      .where(eq(userChallengeJournals.userChallengeId, enrollment.id)),
    listChallengeDayVideos(challengeId),
  ]);
  const doneDates = new Set(allLogs.map((r) => r.dateStr));
  const journalByDate = new Map(allJournals.map((r) => [r.dateStr, r]));
  const videoByDate = new Map(allVideos.map((r) => [r.dateStr, r]));

  const week = REAL_FOOD_RESET.days.map((d) => {
    const posted = parseReplayToken(videoByDate.get(d.dateStr)?.videoId);
    const source = posted || (d.videoId ? parseReplayToken(d.videoId) : null);
    const isToday = d.dateStr === todayStr;
    const liveOpen = !!(
      isToday &&
      d.format === "live" &&
      challenge?.meetUrl &&
      challengeLiveMeetOpen(nowMountain().slice(11, 16), !!posted)
    );
    const j = journalByDate.get(d.dateStr);
    return {
      ...d,
      weekdayShort: WEEKDAY_SHORT[d.n - 1] ?? d.weekday.slice(0, 1),
      done: doneDates.has(d.dateStr),
      isToday,
      isFuture: d.dateStr > todayStr,
      liveOpen,
      meetUrl: liveOpen ? challenge!.meetUrl! : null,
      videoUrl: source ? replayWatchUrl(source) : null,
      replayEmbedUrl: source ? replayEmbedUrl(source) : null,
      prompts: d.journal,
      journal: {
        noticed: j?.noticed || "",
        glad: j?.glad || "",
        hard: j?.hard || "",
      },
    };
  });

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
    videoUrl: replaySource ? replayWatchUrl(replaySource) : null,
    replayVideoId: replay?.videoId ?? null,
    replayEmbedUrl: replaySource ? replayEmbedUrl(replaySource) : null,
    liveTime: REAL_FOOD_RESET.liveTime,
    journal: journalRow
      ? {
          noticed: journalRow.noticed || "",
          glad: journalRow.glad || "",
          hard: journalRow.hard || "",
        }
      : { noticed: "", glad: "", hard: "" },
    guides: REAL_FOOD_RESET_GUIDES,
    guideImages: realFoodResetGuideImages(),
    documents,
    previewDays: [...REAL_FOOD_RESET.days],
    week,
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
