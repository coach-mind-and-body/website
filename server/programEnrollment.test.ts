import { describe, expect, it } from "vitest";
import {
  HOLIDAY_ONBOARDING_SEQUENCE_ID,
  METABOLIC_ONBOARDING_SEQUENCE_ID,
  type ProgramId,
} from "@shared/programs";
import {
  acceptHolidayApplication,
  EnrollmentConflictError,
  enrollInPrograms,
  enrollPerson,
  type EnrollmentStore,
  type StoredEnrollment,
  type StoredHolidayApplication,
  type StoredUser,
} from "./programEnrollment";

type SessionRow = { enrollmentId: number; userId: number; sessionNumber: number };

function memoryStore() {
  const users: StoredUser[] = [];
  const enrollments: StoredEnrollment[] = [];
  const sessions: SessionRow[] = [];
  const challenges: { userId: number; challengeId: number }[] = [];
  const applications: StoredHolidayApplication[] = [];
  let userId = 1;
  let enrollmentId = 1;
  const welcome: { email: string; program?: ProgramId; programs?: ProgramId[] }[] = [];
  const sequences: { email: string; sequenceId: string }[] = [];

  const store: EnrollmentStore = {
    async findUserByEmail(email) {
      return users.find((user) => user.email === email.trim().toLowerCase()) ?? null;
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
      const user = users.find((row) => row.id === id);
      if (!user) return;
      if (patch.name !== undefined) user.name = patch.name;
      if (patch.phone !== undefined) user.phone = patch.phone;
      if (patch.pendingWelcome !== undefined) user.pendingWelcome = patch.pendingWelcome;
    },
    async findEnrollment(userIdValue, program) {
      return enrollments.find((row) => row.userId === userIdValue && row.program === program) ?? null;
    },
    async insertEnrollment(row) {
      const created: StoredEnrollment = { ...row, id: enrollmentId++ };
      enrollments.push(created);
      return created;
    },
    async updateEnrollment(id, patch) {
      const row = enrollments.find((item) => item.id === id);
      if (!row) return;
      Object.assign(row, patch);
    },
    async sessionCount(id) {
      return sessions.filter((row) => row.enrollmentId === id).length;
    },
    async insertSessions(rows) {
      sessions.push(...rows);
    },
    async findUserChallenge(userIdValue, challengeId) {
      const row = challenges.find((item) => item.userId === userIdValue && item.challengeId === challengeId);
      return row ? { id: challengeId } : null;
    },
    async insertUserChallenge(row) {
      challenges.push({ userId: row.userId, challengeId: row.challengeId });
    },
    async findHolidayApplication(id) {
      return applications.find((row) => row.id === id) ?? null;
    },
    async markHolidayAccepted(id, linkedEnrollmentId) {
      const row = applications.find((item) => item.id === id);
      if (!row) return;
      row.status = "accepted";
      row.enrollmentId = linkedEnrollmentId;
    },
  };

  const deps = {
    sendWelcome: async (params: { clientEmail: string; program: ProgramId; programs?: ProgramId[] }) => {
      welcome.push({ email: params.clientEmail, program: params.program, programs: params.programs });
      return true;
    },
    startSequence: async (email: string, _name: string | null, sequenceId: string) => {
      sequences.push({ email, sequenceId });
      return true;
    },
    createResetToken: () => "reset-token",
    now: new Date("2026-11-10T12:00:00Z"),
  };

  return { store, users, enrollments, sessions, applications, welcome, sequences, deps };
}

describe("enrollPerson", () => {
  it("enrolls an existing user in a second program without a new account or six sessions", async () => {
    const mem = memoryStore();
    mem.users.push({ id: 4, name: "Ava", email: "ava@example.com", phone: null });
    mem.enrollments.push({
      id: 9,
      userId: 4,
      program: "reclaim",
      status: "active",
      paymentType: "full",
      depositPaid: true,
      balancePaid: true,
    });

    const result = await enrollPerson(
      mem.store,
      { email: "Ava@example.com", program: "fpu" },
      mem.deps
    );

    expect(result.createdUser).toBe(false);
    expect(result.program).toBe("fpu");
    expect(mem.users).toHaveLength(1);
    expect(mem.enrollments.map((row) => row.program).sort()).toEqual(["fpu", "reclaim"]);
    expect(mem.sessions).toHaveLength(0);
    expect(mem.welcome).toHaveLength(0);
    expect(mem.sequences).toEqual([{ email: "ava@example.com", sequenceId: "fpu_babystep_1" }]);
  });

  it("creates an account and sends one welcome email for a new person", async () => {
    const mem = memoryStore();
    const result = await enrollPerson(
      mem.store,
      { email: "new@gmail.com", name: "New Person", program: "metabolic" },
      mem.deps
    );

    expect(result.createdUser).toBe(true);
    expect(mem.users[0]).toMatchObject({ email: "new@gmail.com", name: "New Person" });
    expect(mem.enrollments).toHaveLength(1);
    expect(mem.enrollments[0].program).toBe("metabolic");
    expect(mem.sessions).toHaveLength(0);
    expect(mem.sequences).toEqual([
      { email: "new@gmail.com", sequenceId: METABOLIC_ONBOARDING_SEQUENCE_ID },
    ]);
    expect(result.sequenceStarted).toBe(true);
    expect(mem.welcome).toEqual([
      { email: "new@gmail.com", program: "metabolic", programs: ["metabolic"] },
    ]);
  });

  it("starts the holiday series once and does not start it again", async () => {
    const mem = memoryStore();
    const first = await enrollPerson(
      mem.store,
      { email: "holly@example.com", name: "Holly Day", program: "holiday" },
      mem.deps
    );
    expect(first.sequenceStarted).toBe(true);
    expect(mem.sequences).toEqual([
      { email: "holly@example.com", sequenceId: HOLIDAY_ONBOARDING_SEQUENCE_ID },
    ]);

    await expect(
      enrollPerson(
        mem.store,
        { email: "holly@example.com", program: "holiday" },
        mem.deps
      )
    ).rejects.toBeInstanceOf(EnrollmentConflictError);
    expect(mem.sequences).toHaveLength(1);
    expect(mem.enrollments).toHaveLength(1);
  });

  it("opens six Reclaim sessions only for Reclaim", async () => {
    const mem = memoryStore();
    await enrollPerson(mem.store, { email: "new@example.com", name: "New Person", program: "reclaim" }, mem.deps);
    expect(mem.sessions.map((row) => row.sessionNumber)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(mem.sequences[0].sequenceId).toBe("reclaim_6_week");
  });
});

describe("enrollInPrograms", () => {
  it("enrolls two programs with one account and one welcome email", async () => {
    const mem = memoryStore();
    const result = await enrollInPrograms(
      mem.store,
      { email: "lee@gmail.com", name: "Lee", programs: ["reclaim", "metabolic"] },
      mem.deps
    );

    expect(result.createdUser).toBe(true);
    expect(mem.users).toHaveLength(1);
    expect(result.enrolled.map((row) => row.program)).toEqual(["reclaim", "metabolic"]);
    expect(mem.sessions).toHaveLength(6);
    expect(mem.welcome).toHaveLength(1);
    expect(mem.welcome[0].programs).toEqual(["reclaim", "metabolic"]);
    expect(mem.sequences.map((row) => row.sequenceId)).toEqual([
      "reclaim_6_week",
      METABOLIC_ONBOARDING_SEQUENCE_ID,
    ]);
    expect(result.message).toContain("R.E.C.L.A.I.M.");
    expect(result.message).toContain("Metabolic Coaching");
  });

  it("starts holiday and metabolic sequences once when both are chosen again", async () => {
    const mem = memoryStore();
    const first = await enrollInPrograms(
      mem.store,
      {
        email: "both@example.com",
        name: "Both Programs",
        programs: ["holiday", "metabolic"],
      },
      mem.deps
    );
    expect(first.sequencesStarted).toEqual([
      HOLIDAY_ONBOARDING_SEQUENCE_ID,
      METABOLIC_ONBOARDING_SEQUENCE_ID,
    ]);

    await expect(
      enrollInPrograms(
        mem.store,
        {
          email: "both@example.com",
          programs: ["holiday", "metabolic"],
        },
        mem.deps
      )
    ).rejects.toBeInstanceOf(EnrollmentConflictError);
    expect(mem.sequences).toHaveLength(2);
  });
});

describe("acceptHolidayApplication", () => {
  it("creates the account, enrolls Metabolic Coaching, and marks the application accepted", async () => {
    const mem = memoryStore();
    mem.applications.push({
      id: 3,
      fullName: "Pat Example",
      email: "pat@example.com",
      phone: "8015551212",
      status: "pending",
      enrollmentId: null,
    });

    const first = await acceptHolidayApplication(mem.store, 3, mem.deps);
    expect(first.createdUser).toBe(true);
    expect(first.program).toBe("metabolic");
    expect(mem.applications[0].status).toBe("accepted");
    expect(mem.applications[0].enrollmentId).toBe(first.enrollmentId);
    expect(mem.welcome).toHaveLength(1);
    expect(first.sequenceStarted).toBe(true);
    expect(mem.sequences).toEqual([
      { email: "pat@example.com", sequenceId: METABOLIC_ONBOARDING_SEQUENCE_ID },
    ]);

    const second = await acceptHolidayApplication(mem.store, 3, mem.deps);
    expect(second.alreadyAccepted).toBe(true);
    expect(second.sequenceStarted).toBe(false);
    expect(mem.users).toHaveLength(1);
    expect(mem.enrollments).toHaveLength(1);
    expect(mem.welcome).toHaveLength(1);
    expect(mem.sequences).toHaveLength(1);
  });
});
