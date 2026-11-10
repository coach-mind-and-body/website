import { and, count, eq, gte, inArray, lte, max } from "drizzle-orm";
import type { ProgramId } from "@shared/programs";
import {
  assignmentSubmissions,
  calorieLogs,
  clientFiles,
  clientIntakes,
  enrollments,
  programIntakeSubmissions,
  userHabitLogs,
  users,
} from "../drizzle/schema";
import { dateToMountainDateStr } from "../lib/mountainTime";
import type { getDb } from "./db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export type RosterClient = {
  enrollmentId: number;
  userId: number;
  name: string;
  email: string;
  shareHabitsWithCoach: boolean;
  enrolledAt: Date;
  lastActivityAt: Date | null;
  assignmentsSubmitted: number;
  formsSubmitted: number;
  foodLogsThisWeek: number;
  uploads: number;
};

/** Monday–Sunday in America/Denver, as YYYY-MM-DD. */
export function mountainWeekRange(now: Date): { start: string; end: string } {
  const today = dateToMountainDateStr(now);
  const [year, month, day] = today.split("-").map(Number);
  const civil = new Date(Date.UTC(year, month - 1, day));
  const weekday = civil.getUTCDay();
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;
  civil.setUTCDate(civil.getUTCDate() - daysSinceMonday);
  const start = civil.toISOString().slice(0, 10);
  civil.setUTCDate(civil.getUTCDate() + 6);
  return { start, end: civil.toISOString().slice(0, 10) };
}

function asDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function bump(map: Map<number, Date>, id: number, value: unknown) {
  const date = asDate(value);
  if (!date) return;
  const prev = map.get(id);
  if (!prev || date > prev) map.set(id, date);
}

function countMap<T extends number>(rows: { id: T; total: unknown }[]): Map<T, number> {
  const map = new Map<T, number>();
  for (const row of rows) map.set(row.id, Number(row.total) || 0);
  return map;
}

export async function loadProgramRoster(db: Db, program: ProgramId, now = new Date()): Promise<RosterClient[]> {
  const enrolled = await db
    .select({
      enrollmentId: enrollments.id,
      userId: enrollments.userId,
      enrolledAt: enrollments.enrolledAt,
      name: users.name,
      email: users.email,
      shareHabitsWithCoach: users.shareHabitsWithCoach,
      lastSignedIn: users.lastSignedIn,
    })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.userId, users.id))
    .where(and(eq(enrollments.program, program), eq(enrollments.status, "active")));

  if (enrolled.length === 0) return [];

  const userIds = enrolled.map((row) => row.userId);
  const enrollmentIds = enrolled.map((row) => row.enrollmentId);
  const emails = enrolled.map((row) => (row.email ?? "").trim().toLowerCase()).filter(Boolean);
  const week = mountainWeekRange(now);

  const [assignmentRows, foodRows, uploadRows, intakeRows, shortRows, foodActivity, assignmentActivity, fileActivity, habitActivity] =
    await Promise.all([
      db
        .select({ id: assignmentSubmissions.userId, total: count() })
        .from(assignmentSubmissions)
        .where(inArray(assignmentSubmissions.userId, userIds))
        .groupBy(assignmentSubmissions.userId),
      db
        .select({ id: calorieLogs.userId, total: count() })
        .from(calorieLogs)
        .where(
          and(
            inArray(calorieLogs.userId, userIds),
            gte(calorieLogs.dateStr, week.start),
            lte(calorieLogs.dateStr, week.end)
          )
        )
        .groupBy(calorieLogs.userId),
      db
        .select({ id: clientFiles.enrollmentId, total: count() })
        .from(clientFiles)
        .where(and(inArray(clientFiles.enrollmentId, enrollmentIds), eq(clientFiles.uploadedByRole, "client")))
        .groupBy(clientFiles.enrollmentId),
      emails.length
        ? db
            .select({ email: clientIntakes.email, total: count() })
            .from(clientIntakes)
            .where(inArray(clientIntakes.email, emails))
            .groupBy(clientIntakes.email)
        : Promise.resolve([]),
      emails.length
        ? db
            .select({ email: programIntakeSubmissions.email, total: count() })
            .from(programIntakeSubmissions)
            .where(
              and(
                eq(programIntakeSubmissions.program, program),
                inArray(programIntakeSubmissions.email, emails)
              )
            )
            .groupBy(programIntakeSubmissions.email)
        : Promise.resolve([]),
      db
        .select({ id: calorieLogs.userId, at: max(calorieLogs.updatedAt) })
        .from(calorieLogs)
        .where(inArray(calorieLogs.userId, userIds))
        .groupBy(calorieLogs.userId),
      db
        .select({ id: assignmentSubmissions.userId, at: max(assignmentSubmissions.submittedAt) })
        .from(assignmentSubmissions)
        .where(inArray(assignmentSubmissions.userId, userIds))
        .groupBy(assignmentSubmissions.userId),
      db
        .select({ id: clientFiles.enrollmentId, at: max(clientFiles.createdAt) })
        .from(clientFiles)
        .where(inArray(clientFiles.enrollmentId, enrollmentIds))
        .groupBy(clientFiles.enrollmentId),
      db
        .select({ id: userHabitLogs.userId, at: max(userHabitLogs.updatedAt) })
        .from(userHabitLogs)
        .where(inArray(userHabitLogs.userId, userIds))
        .groupBy(userHabitLogs.userId),
    ]);

  const assignments = countMap(assignmentRows);
  const foods = countMap(foodRows);
  const uploads = countMap(uploadRows);
  const intakeByEmail = new Map(intakeRows.map((row) => [row.email.toLowerCase(), Number(row.total) || 0]));
  const shortByEmail = new Map(shortRows.map((row) => [row.email.toLowerCase(), Number(row.total) || 0]));

  const activity = new Map<number, Date>();
  for (const row of enrolled) bump(activity, row.userId, row.lastSignedIn);
  for (const row of foodActivity) bump(activity, row.id, row.at);
  for (const row of assignmentActivity) bump(activity, row.id, row.at);
  for (const row of habitActivity) bump(activity, row.id, row.at);
  const enrollmentUser = new Map(enrolled.map((row) => [row.enrollmentId, row.userId]));
  for (const row of fileActivity) {
    const userId = enrollmentUser.get(row.id);
    if (userId) bump(activity, userId, row.at);
  }

  return enrolled
    .map((row) => {
      const email = (row.email ?? "").trim().toLowerCase();
      return {
        enrollmentId: row.enrollmentId,
        userId: row.userId,
        name: row.name?.trim() || email || "Client",
        email,
        shareHabitsWithCoach: !!row.shareHabitsWithCoach,
        enrolledAt: row.enrolledAt,
        lastActivityAt: activity.get(row.userId) ?? null,
        assignmentsSubmitted: assignments.get(row.userId) ?? 0,
        formsSubmitted: (intakeByEmail.get(email) ?? 0) + (shortByEmail.get(email) ?? 0),
        foodLogsThisWeek: foods.get(row.userId) ?? 0,
        uploads: uploads.get(row.enrollmentId) ?? 0,
      };
    })
    .sort((a, b) => b.enrolledAt.getTime() - a.enrolledAt.getTime());
}
