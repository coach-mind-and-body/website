import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTableName, type SQL } from "drizzle-orm";
import { MySqlDialect } from "drizzle-orm/mysql-core";

vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

vi.mock("./emailMarketing", async () => {
  const actual =
    await vi.importActual<typeof import("./emailMarketing")>(
      "./emailMarketing"
    );
  return {
    ...actual,
    sendMarketingEmail: vi.fn(),
  };
});

import { METABOLIC_ONBOARDING_SEQUENCE_ID } from "@shared/programs";
import { sequenceEnrollments, subscribers } from "../drizzle/schema";
import { getDb } from "./db";
import { sendMarketingEmail } from "./emailMarketing";
import {
  enrollSubmittedIntake,
  type IntakeLeadStore,
} from "./intakeEnrollment";
import {
  EnrollmentConflictError,
  enrollInPrograms,
  type EnrollmentStore,
  type StoredEnrollment,
  type StoredUser,
} from "./programEnrollment";
import { enrollUserInSequence, processEmailSequences } from "./sequences";

type Row = Record<string, unknown>;

const dialect = new MySqlDialect();

function predicates(condition: unknown): { column: string; value: unknown }[] {
  const query = dialect.sqlToQuery(condition as SQL);
  const parts = query.sql.split(/\band\b/i);
  const preds: { column: string; value: unknown }[] = [];
  let paramIndex = 0;
  for (const part of parts) {
    const columns = [...part.matchAll(/`([^`]+)`/g)].map(match => match[1]);
    const placeholders = part.match(/\?/g)?.length ?? 0;
    if (columns.length > 0 && placeholders === 1) {
      preds.push({
        column: columns[columns.length - 1],
        value: query.params[paramIndex],
      });
    }
    paramIndex += placeholders;
  }
  return preds;
}

function snapshot(row: Row): Row {
  const copy: Row = { ...row };
  if (copy.createdAt instanceof Date) {
    copy.createdAt = new Date(copy.createdAt.getTime());
  }
  if (copy.updatedAt instanceof Date) {
    copy.updatedAt = new Date(copy.updatedAt.getTime());
  }
  return copy;
}

function memoryDb() {
  const subs: Row[] = [];
  const enrollments: Row[] = [];

  function rowsFor(table: unknown): Row[] {
    const name = getTableName(table as never);
    if (name === getTableName(subscribers)) return subs;
    if (name === getTableName(sequenceEnrollments)) return enrollments;
    throw new Error(`Unexpected table ${name}`);
  }

  function matching(table: unknown, condition: unknown): Row[] {
    const preds = predicates(condition);
    if (preds.length === 0) return [];
    return rowsFor(table).filter(row =>
      preds.every(pred => row[pred.column] === pred.value)
    );
  }

  const db = {
    select() {
      return {
        from(table: unknown) {
          return {
            where(condition: unknown) {
              const rows = matching(table, condition).map(snapshot);
              return Object.assign(Promise.resolve(rows), {
                limit: async (n: number) => rows.slice(0, n),
              });
            },
          };
        },
      };
    },
    insert(table: unknown) {
      return {
        values(row: Row) {
          const store = rowsFor(table);
          const id = store.length + 1;
          const now = new Date();
          store.push({
            status: "active",
            currentStepId: 0,
            createdAt: now,
            updatedAt: now,
            firstName: null,
            lastName: null,
            segments: null,
            ...row,
            id,
          });
          return { $returningId: async () => [{ id }] };
        },
      };
    },
    update(table: unknown) {
      return {
        set(patch: Row) {
          return {
            where: async (condition: unknown) => {
              const rows = matching(table, condition);
              for (const row of rows) Object.assign(row, patch);
              return [{ affectedRows: rows.length }, []];
            },
          };
        },
      };
    },
  };

  return { db, subs, enrollments };
}

function programAccounts(seedUsers: StoredUser[] = []) {
  const users = [...seedUsers];
  const programEnrollments: StoredEnrollment[] = [];
  const welcome: string[] = [];
  const leads: { email: string; needsProgram: boolean; status: string }[] = [];
  let userId = users.reduce((max, user) => Math.max(max, user.id), 0) + 1;
  let enrollmentId = 1;

  const store: EnrollmentStore = {
    async findUserByEmail(email) {
      return (
        users.find(user => user.email === email.trim().toLowerCase()) ?? null
      );
    },
    async insertUser(row) {
      const user: StoredUser = {
        id: userId++,
        name: row.name,
        email: row.email,
        phone: row.phone,
        pendingWelcome: row.pendingWelcome ?? false,
      };
      users.push(user);
      return user;
    },
    async updateUser(id, patch) {
      const user = users.find(row => row.id === id);
      if (!user) return;
      if (patch.name !== undefined) user.name = patch.name;
      if (patch.phone !== undefined) user.phone = patch.phone;
      if (patch.pendingWelcome !== undefined) {
        user.pendingWelcome = patch.pendingWelcome;
      }
    },
    async findEnrollment(userIdValue, program) {
      return (
        programEnrollments.find(
          row => row.userId === userIdValue && row.program === program
        ) ?? null
      );
    },
    async insertEnrollment(row) {
      const created: StoredEnrollment = { ...row, id: enrollmentId++ };
      programEnrollments.push(created);
      return created;
    },
    async updateEnrollment(id, patch) {
      const row = programEnrollments.find(item => item.id === id);
      if (row) Object.assign(row, patch);
    },
    async sessionCount() {
      return 0;
    },
    async insertSessions() {},
    async findUserChallenge() {
      return null;
    },
    async insertUserChallenge() {},
    async findHolidayApplication() {
      return null;
    },
    async markHolidayAccepted() {},
  };

  const leadStore: IntakeLeadStore = {
    async flagNeedsProgram() {},
    async clearNeedsProgram(email) {
      const lead = leads.find(row => row.email === email && row.needsProgram);
      if (!lead) return;
      lead.needsProgram = false;
      lead.status = "enrolled";
    },
  };

  return {
    store,
    leadStore,
    users,
    programEnrollments,
    welcome,
    deps: {
      sendWelcome: async (params: { clientEmail: string }) => {
        welcome.push(params.clientEmail);
        return true;
      },
      startSequence: enrollUserInSequence,
      createResetToken: () => "reset-token",
      now: new Date("2026-11-10T12:00:00Z"),
    },
  };
}

describe("day-0 sequence email", () => {
  let mem: ReturnType<typeof memoryDb>;

  beforeEach(() => {
    mem = memoryDb();
    vi.mocked(getDb).mockReset();
    vi.mocked(getDb).mockResolvedValue(mem.db as never);
    vi.mocked(sendMarketingEmail).mockReset();
    vi.mocked(sendMarketingEmail).mockResolvedValue({ ok: true });
  });

  it("sends step 1 once when a client is enrolled", async () => {
    const enrolled = await enrollUserInSequence(
      "ada@example.com",
      "Ada",
      METABOLIC_ONBOARDING_SEQUENCE_ID
    );

    expect(enrolled).toBe(true);
    expect(sendMarketingEmail).toHaveBeenCalledTimes(1);
    expect(sendMarketingEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ada@example.com",
        subject: "You're in. Let's start these five weeks",
      })
    );
    expect(mem.enrollments).toHaveLength(1);
    expect(mem.enrollments[0]).toMatchObject({
      currentStepId: 1,
      status: "active",
    });

    const again = await enrollUserInSequence(
      "ada@example.com",
      "Ada",
      METABOLIC_ONBOARDING_SEQUENCE_ID
    );
    expect(again).toBe(true);
    expect(mem.enrollments).toHaveLength(1);
    expect(sendMarketingEmail).toHaveBeenCalledTimes(1);
  });

  it("does not resend step 1 on the next poller pass", async () => {
    await enrollUserInSequence(
      "ada@example.com",
      "Ada",
      METABOLIC_ONBOARDING_SEQUENCE_ID
    );
    expect(sendMarketingEmail).toHaveBeenCalledTimes(1);

    const result = await processEmailSequences();

    expect(result).toEqual({ success: true, emailsSent: 0 });
    expect(sendMarketingEmail).toHaveBeenCalledTimes(1);
    expect(mem.enrollments[0].currentStepId).toBe(1);
  });

  it("keeps the enrollment when the day-0 send fails", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(sendMarketingEmail).mockResolvedValueOnce({
      ok: false,
      error: "Resend is down",
    });

    const enrolled = await enrollUserInSequence(
      "ada@example.com",
      "Ada",
      METABOLIC_ONBOARDING_SEQUENCE_ID
    );

    expect(enrolled).toBe(true);
    expect(mem.subs).toHaveLength(1);
    expect(mem.enrollments).toHaveLength(1);
    expect(mem.enrollments[0]).toMatchObject({
      status: "active",
      currentStepId: 0,
    });
    expect(errors).toHaveBeenCalled();

    vi.mocked(sendMarketingEmail).mockResolvedValueOnce({ ok: true });
    const result = await processEmailSequences();

    expect(result).toEqual({ success: true, emailsSent: 1 });
    expect(sendMarketingEmail).toHaveBeenCalledTimes(2);
    expect(mem.enrollments[0]).toMatchObject({
      status: "active",
      currentStepId: 1,
    });
    errors.mockRestore();
  });

  it("does not break enrollment when the send throws", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(sendMarketingEmail).mockRejectedValueOnce(new Error("network"));

    await expect(
      enrollUserInSequence(
        "bea@example.com",
        "Bea",
        METABOLIC_ONBOARDING_SEQUENCE_ID
      )
    ).resolves.toBe(true);

    expect(mem.enrollments[0]).toMatchObject({
      status: "active",
      currentStepId: 0,
    });
    expect(errors).toHaveBeenCalled();
    errors.mockRestore();
  });

  it("does not double-send when the poller runs during the day-0 send", async () => {
    let calls = 0;
    let releaseSend: (result: { ok: true }) => void = () => {};
    const sendStarted = new Promise<void>(resolve => {
      vi.mocked(sendMarketingEmail).mockImplementation(() => {
        calls += 1;
        if (calls > 1) return Promise.resolve({ ok: true });
        return new Promise(resolveSend => {
          releaseSend = resolveSend;
          resolve();
        });
      });
    });

    const enrolled = enrollUserInSequence(
      "ada@example.com",
      "Ada",
      METABOLIC_ONBOARDING_SEQUENCE_ID
    );
    await sendStarted;
    expect(mem.enrollments[0].currentStepId).toBe(1);

    await processEmailSequences();
    releaseSend({ ok: true });

    await expect(enrolled).resolves.toBe(true);
    expect(calls).toBe(1);
    expect(mem.enrollments[0]).toMatchObject({
      currentStepId: 1,
      status: "active",
    });
  });

  it("leaves an interval series for the poller", async () => {
    const enrolled = await enrollUserInSequence(
      "ada@example.com",
      "Ada",
      "reclaim_6_week"
    );

    expect(enrolled).toBe(true);
    expect(sendMarketingEmail).not.toHaveBeenCalled();
    expect(mem.enrollments[0]).toMatchObject({
      currentStepId: 0,
      status: "active",
    });
  });

  it("sends day 0 from the admin enroll window", async () => {
    const accounts = programAccounts();
    const result = await enrollInPrograms(
      accounts.store,
      {
        email: "Ada@example.com",
        name: "Ada Stone",
        programs: ["metabolic"],
      },
      accounts.deps
    );

    expect(result.sequencesStarted).toEqual([METABOLIC_ONBOARDING_SEQUENCE_ID]);
    expect(result.welcomeEmailSent).toBe(true);
    expect(accounts.welcome).toEqual(["ada@example.com"]);
    expect(sendMarketingEmail).toHaveBeenCalledTimes(1);
    expect(sendMarketingEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ada@example.com",
        subject: "You're in. Let's start these five weeks",
      })
    );
    expect(mem.enrollments[0]).toMatchObject({
      currentStepId: 1,
      status: "active",
    });

    await expect(
      enrollInPrograms(
        accounts.store,
        {
          email: "ada@example.com",
          name: "Ada Stone",
          programs: ["metabolic"],
        },
        accounts.deps
      )
    ).rejects.toBeInstanceOf(EnrollmentConflictError);
    expect(sendMarketingEmail).toHaveBeenCalledTimes(1);
  });

  it("sends day 0 when an existing account is enrolled from the admin window", async () => {
    const accounts = programAccounts([
      {
        id: 8,
        name: "Ada Stone",
        email: "ada@example.com",
        phone: null,
        pendingWelcome: false,
      },
    ]);

    const result = await enrollInPrograms(
      accounts.store,
      {
        email: "Ada@example.com",
        name: "Ada Stone",
        programs: ["metabolic"],
      },
      accounts.deps
    );

    expect(result.createdUser).toBe(false);
    expect(result.welcomeEmailSent).toBe(false);
    expect(accounts.welcome).toHaveLength(0);
    expect(result.sequencesStarted).toEqual([METABOLIC_ONBOARDING_SEQUENCE_ID]);
    expect(sendMarketingEmail).toHaveBeenCalledTimes(1);
    expect(mem.enrollments[0]).toMatchObject({
      currentStepId: 1,
      status: "active",
    });
  });

  it("sends day 0 from the intake form and skips the welcome for an existing account", async () => {
    const accounts = programAccounts([
      {
        id: 4,
        name: "Ada Stone",
        email: "ada@example.com",
        phone: null,
        pendingWelcome: false,
      },
    ]);

    const result = await enrollSubmittedIntake(
      accounts.store,
      accounts.leadStore,
      {
        email: "Ada@example.com",
        name: "Ada Stone",
        phone: "8015551212",
        program: "metabolic",
      },
      accounts.deps
    );

    expect(result.enrolled).toBe(true);
    expect(result.createdUser).toBe(false);
    expect(result.welcomeEmailSent).toBe(false);
    expect(accounts.welcome).toHaveLength(0);
    expect(sendMarketingEmail).toHaveBeenCalledTimes(1);
    expect(sendMarketingEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ada@example.com",
        subject: "You're in. Let's start these five weeks",
      })
    );
    expect(mem.enrollments[0]).toMatchObject({
      currentStepId: 1,
      status: "active",
    });

    const again = await enrollSubmittedIntake(
      accounts.store,
      accounts.leadStore,
      {
        email: "ada@example.com",
        name: "Ada Stone",
        phone: "8015551212",
        program: "metabolic",
      },
      accounts.deps
    );
    expect(again.alreadyEnrolled).toBe(true);
    expect(again.welcomeEmailSent).toBe(false);
    expect(sendMarketingEmail).toHaveBeenCalledTimes(1);
  });
});
