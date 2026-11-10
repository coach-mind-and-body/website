import { describe, expect, it, vi } from "vitest";
import type { User } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";
import { mountainWeekRange } from "./programRoster";

vi.mock("./db", () => ({
  getDb: vi.fn(async () => null),
}));

import { enrollmentRouter } from "./routers/enrollment";
import { programIntakeRouter } from "./routers/programIntake";

function context(role: "admin" | "user" | null): TrpcContext {
  const user =
    role === null
      ? null
      : ({
          id: 1,
          openId: "test",
          email: role === "admin" ? "coach@mindandbodyresetcoach.com" : "client@example.com",
          name: role === "admin" ? "Lee Anne" : "Client",
          role,
        } as User);
  return { user, req: new Request("https://mindandbodyresetcoach.com/admin") };
}

describe("program roster permissions", () => {
  it("is admin only", async () => {
    const admin = enrollmentRouter.createCaller(context("admin"));
    await expect(admin.adminProgramRoster({ program: "metabolic" })).resolves.toEqual([]);

    const client = enrollmentRouter.createCaller(context("user"));
    await expect(client.adminProgramRoster({ program: "metabolic" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    const guest = enrollmentRouter.createCaller(context(null));
    await expect(guest.adminProgramRoster({ program: "fpu" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("keeps intake question changes admin only", async () => {
    const client = programIntakeRouter.createCaller(context("user"));
    await expect(client.addQuestion({ program: "fpu", prompt: "What is your goal?" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(client.adminQuestions({ program: "fpu" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

describe("mountain week", () => {
  it("starts on Monday in Denver", () => {
    const tuesday = mountainWeekRange(new Date("2026-11-10T19:00:00Z"));
    expect(tuesday).toEqual({ start: "2026-11-09", end: "2026-11-15" });

    const sunday = mountainWeekRange(new Date("2026-11-08T20:00:00Z"));
    expect(sunday).toEqual({ start: "2026-11-02", end: "2026-11-08" });
  });
});
