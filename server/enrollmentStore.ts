import { and, eq, sql } from "drizzle-orm";
import {
  coachingSessions,
  holidayApplications,
  enrollments,
  userChallenges,
  users,
} from "../drizzle/schema";
import type { getDb } from "./db";
import type {
  EnrollmentStore,
  StoredEnrollment,
  StoredHolidayApplication,
  StoredUser,
} from "./programEnrollment";
import { normalizeEnrollmentEmail } from "./programEnrollment";
import type { ProgramId } from "@shared/programs";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

function asUser(row: {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  pendingWelcome?: boolean | null;
}): StoredUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    pendingWelcome: !!row.pendingWelcome,
  };
}

export function drizzleEnrollmentStore(db: Db): EnrollmentStore {
  return {
    async findUserByEmail(email) {
      const normalized = normalizeEnrollmentEmail(email);
      const rows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          pendingWelcome: users.pendingWelcome,
        })
        .from(users)
        .where(sql`lower(${users.email}) = ${normalized}`)
        .limit(1);
      return rows[0] ? asUser(rows[0]) : null;
    },

    async insertUser(row) {
      const inserted = await db
        .insert(users)
        .values({
          openId: row.openId,
          name: row.name,
          email: row.email,
          phone: row.phone,
          loginMethod: "email",
          emailVerified: false,
          role: "user",
          passwordResetToken: row.passwordResetToken,
          passwordResetExpiry: row.passwordResetExpiry,
          pendingWelcome: row.pendingWelcome ?? false,
          lastSignedIn: new Date(),
        })
        .$returningId();
      const id = inserted[0]?.id;
      if (!id) throw new Error("Failed to create user account");
      return {
        id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        pendingWelcome: row.pendingWelcome ?? false,
      };
    },

    async updateUser(id, patch) {
      await db.update(users).set(patch).where(eq(users.id, id));
    },

    async findEnrollment(userId, program) {
      const rows = await db
        .select({
          id: enrollments.id,
          userId: enrollments.userId,
          program: enrollments.program,
          status: enrollments.status,
          paymentType: enrollments.paymentType,
          depositPaid: enrollments.depositPaid,
          balancePaid: enrollments.balancePaid,
        })
        .from(enrollments)
        .where(and(eq(enrollments.userId, userId), eq(enrollments.program, program)))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      return row as StoredEnrollment;
    },

    async insertEnrollment(row) {
      const inserted = await db
        .insert(enrollments)
        .values({
          userId: row.userId,
          program: row.program,
          paymentType: row.paymentType,
          depositPaid: row.depositPaid,
          balancePaid: row.balancePaid,
          status: "active",
        })
        .$returningId();
      const id = inserted[0]?.id;
      if (!id) throw new Error("Failed to create enrollment");
      return {
        id,
        userId: row.userId,
        program: row.program,
        status: "active",
        paymentType: row.paymentType,
        depositPaid: row.depositPaid,
        balancePaid: row.balancePaid,
      };
    },

    async updateEnrollment(id, patch) {
      await db.update(enrollments).set(patch).where(eq(enrollments.id, id));
    },

    async sessionCount(enrollmentId) {
      const rows = await db
        .select({ id: coachingSessions.id })
        .from(coachingSessions)
        .where(eq(coachingSessions.enrollmentId, enrollmentId));
      return rows.length;
    },

    async insertSessions(rows) {
      if (rows.length === 0) return;
      await db.insert(coachingSessions).values(
        rows.map((row) => ({
          enrollmentId: row.enrollmentId,
          userId: row.userId,
          sessionNumber: row.sessionNumber,
          status: "not_scheduled" as const,
          adminNotes: row.adminNotes,
        }))
      );
    },

    async findUserChallenge(userId, challengeId) {
      const rows = await db
        .select({ id: userChallenges.id })
        .from(userChallenges)
        .where(and(eq(userChallenges.userId, userId), eq(userChallenges.challengeId, challengeId)))
        .limit(1);
      return rows[0] ?? null;
    },

    async insertUserChallenge(row) {
      await db.insert(userChallenges).values({
        userId: row.userId,
        email: row.email,
        challengeId: row.challengeId,
        startDate: row.startDate,
        status: "active",
      });
    },

    async findHolidayApplication(id): Promise<StoredHolidayApplication | null> {
      const rows = await db
        .select({
          id: holidayApplications.id,
          fullName: holidayApplications.fullName,
          email: holidayApplications.email,
          phone: holidayApplications.phone,
          status: holidayApplications.status,
          enrollmentId: holidayApplications.enrollmentId,
        })
        .from(holidayApplications)
        .where(eq(holidayApplications.id, id))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      return {
        id: row.id,
        fullName: row.fullName,
        email: row.email,
        phone: row.phone,
        status: row.status,
        enrollmentId: row.enrollmentId,
      };
    },

    async markHolidayAccepted(id, enrollmentId, acceptedAt) {
      await db
        .update(holidayApplications)
        .set({ status: "accepted", enrollmentId, acceptedAt })
        .where(eq(holidayApplications.id, id));
    },
  };
}

export async function searchClients(db: Db, query: string) {
  const clean = query.trim().toLowerCase().replace(/[\\%_]/g, "");
  if (clean.length < 2) return [];
  const pattern = `%${clean}%`;
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(sql`lower(${users.email}) like ${pattern} or lower(coalesce(${users.name}, '')) like ${pattern}`)
    .limit(8);
}

export function programOrThrow(value: string): ProgramId {
  if (
    value === "reclaim" ||
    value === "fpu" ||
    value === "challenge" ||
    value === "holiday" ||
    value === "metabolic"
  ) {
    return value;
  }
  throw new Error(`Unknown program: ${value}`);
}
