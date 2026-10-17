import { describe, expect, it } from "vitest";
import { isPairsReminderWindow } from "./cron";

describe("pairs reminder window", () => {
  it("opens Sunday at 5pm Denver on the last day of the round", () => {
    expect(isPairsReminderWindow(new Date("2026-10-19T00:00:00.000Z"))).toBe(true);
    expect(isPairsReminderWindow(new Date("2026-10-18T22:00:00.000Z"))).toBe(false);
    expect(isPairsReminderWindow(new Date("2026-11-02T01:00:00.000Z"))).toBe(true);
  });

  it("stays closed on the Sunday in the middle of a two-week round", () => {
    expect(isPairsReminderWindow(new Date("2026-10-26T00:00:00.000Z"))).toBe(false);
    expect(isPairsReminderWindow(new Date("2026-10-20T15:00:00.000Z"))).toBe(false);
  });
});