import { describe, expect, it } from "vitest";
import { METABOLIC_ONBOARDING_SEQUENCE_ID, type ProgramId } from "@shared/programs";
import { programIdFromIntakeSlug, programIntakePath } from "@shared/programIntake";
import { enrollSubmittedIntake, type IntakeLeadStore } from "./intakeEnrollment";
import {
  type EnrollmentStore,
  type StoredEnrollment,
  type StoredUser,
} from "./programEnrollment";

type Lead = {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  needsProgram: boolean;
  status: string;
};

function harness() {
  const users: StoredUser[] = [];
  const enrollments: StoredEnrollment[] = [];
  const leads: Lead[] = [];
  const welcome: string[] = [];
  const sequences: { email: string; sequenceId: string }[] = [];
  let userId = 1;
  let enrollmentId = 1;
  let leadId = 1;

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
    async flagNeedsProgram(input) {
      const email = input.email.trim().toLowerCase();
      const existing = leads.find((lead) => lead.email === email);
      if (existing) {
        existing.needsProgram = true;
        existing.name = input.name || existing.name;
        existing.phone = existing.phone || input.phone || null;
        return;
      }
      leads.push({
        id: leadId++,
        email,
        name: input.name,
        phone: input.phone ?? null,
        needsProgram: true,
        status: "new",
      });
    },
    async clearNeedsProgram(email) {
      const normalized = email.trim().toLowerCase();
      const lead = leads.find((row) => row.email === normalized && row.needsProgram);
      if (!lead) return;
      lead.needsProgram = false;
      lead.status = "enrolled";
    },
  };

  const deps = {
    sendWelcome: async (params: { clientEmail: string }) => {
      welcome.push(params.clientEmail);
      return true;
    },
    startSequence: async (email: string, _name: string | null, sequenceId: string) => {
      sequences.push({ email, sequenceId });
      return true;
    },
    createResetToken: () => "reset-token",
    now: new Date("2026-11-10T18:00:00Z"),
  };

  function submit(program: ProgramId | null, person: { email: string; name: string; phone?: string }) {
    return enrollSubmittedIntake(
      store,
      leadStore,
      { email: person.email, name: person.name, phone: person.phone ?? "8015551212", program },
      deps
    );
  }

  return { users, enrollments, leads, welcome, sequences, submit };
}

describe("intake to enrollment", () => {
  it("creates an account, enrolls Metabolic Coaching, and sends one welcome", async () => {
    const mem = harness();
    const result = await mem.submit("metabolic", {
      email: "New.Client@gmail.com",
      name: "New Client",
    });

    expect(result.createdUser).toBe(true);
    expect(result.enrolled).toBe(true);
    expect(result.needsProgram).toBe(false);
    expect(result.welcomeEmailSent).toBe(true);
    expect(mem.users).toHaveLength(1);
    expect(mem.users[0]).toMatchObject({ email: "new.client@gmail.com", name: "New Client" });
    expect(mem.enrollments).toEqual([expect.objectContaining({ program: "metabolic", status: "active" })]);
    expect(mem.welcome).toEqual(["new.client@gmail.com"]);
    expect(mem.sequences).toEqual([
      { email: "new.client@gmail.com", sequenceId: METABOLIC_ONBOARDING_SEQUENCE_ID },
    ]);
    expect(mem.leads).toHaveLength(0);
  });

  it("enrolls an existing email without a second account or welcome email", async () => {
    const mem = harness();
    mem.users.push({ id: 9, name: "Ava Stone", email: "ava@example.com", phone: null, pendingWelcome: false });

    const result = await mem.submit("fpu", { email: "Ava@example.com", name: "Ava Stone" });

    expect(result.createdUser).toBe(false);
    expect(result.welcomeEmailSent).toBe(false);
    expect(result.enrolled).toBe(true);
    expect(mem.users).toHaveLength(1);
    expect(mem.enrollments).toHaveLength(1);
    expect(mem.enrollments[0].program).toBe("fpu");
    expect(mem.welcome).toHaveLength(0);
    expect(mem.sequences.map((row) => row.sequenceId)).toEqual(["fpu_babystep_1"]);
  });

  it("does not duplicate the account, enrollment, or welcome when the form is sent again", async () => {
    const mem = harness();
    const person = { email: "pat@example.com", name: "Pat Example" };
    const first = await mem.submit("holiday", person);
    const second = await mem.submit("holiday", person);

    expect(first.welcomeEmailSent).toBe(true);
    expect(second.alreadyEnrolled).toBe(true);
    expect(second.welcomeEmailSent).toBe(false);
    expect(mem.users).toHaveLength(1);
    expect(mem.enrollments).toHaveLength(1);
    expect(mem.welcome).toEqual(["pat@example.com"]);
    expect(mem.sequences).toHaveLength(1);
  });

  it("creates the lead and account without enrolling when the program is unknown", async () => {
    const mem = harness();
    const first = await mem.submit(null, { email: "unsure@example.com", name: "Unsure Client" });
    const second = await mem.submit(null, { email: "unsure@example.com", name: "Unsure Client" });

    expect(first.needsProgram).toBe(true);
    expect(first.enrolled).toBe(false);
    expect(first.createdUser).toBe(true);
    expect(first.welcomeEmailSent).toBe(false);
    expect(second.createdUser).toBe(false);
    expect(mem.users).toHaveLength(1);
    expect(mem.users[0].pendingWelcome).toBe(true);
    expect(mem.enrollments).toHaveLength(0);
    expect(mem.welcome).toHaveLength(0);
    expect(mem.sequences).toHaveLength(0);
    expect(mem.leads).toEqual([
      expect.objectContaining({
        email: "unsure@example.com",
        needsProgram: true,
        status: "new",
      }),
    ]);

    const enrolled = await mem.submit("reclaim", { email: "unsure@example.com", name: "Unsure Client" });
    expect(enrolled.enrolled).toBe(true);
    expect(enrolled.welcomeEmailSent).toBe(true);
    expect(mem.users).toHaveLength(1);
    expect(mem.enrollments).toHaveLength(1);
    expect(mem.welcome).toEqual(["unsure@example.com"]);
    expect(mem.leads[0]).toMatchObject({ needsProgram: false, status: "enrolled" });
  });
});

describe("intake links", () => {
  it("keeps the existing form as the Metabolic Coaching link and gives other programs their own path", () => {
    expect(programIntakePath("metabolic")).toBe("/client-intake");
    expect(programIdFromIntakeSlug("metabolic-coaching")).toBe("metabolic");
    expect(programIntakePath("fpu")).toBe("/intake/fpu");
    expect(programIntakePath("reclaim")).toBe("/intake/reclaim");
    expect(programIntakePath("challenge")).toBe("/intake/challenge");
    expect(programIntakePath("holiday")).toBe("/intake/holiday");
    expect(programIdFromIntakeSlug("not-a-program")).toBeNull();
  });
});
