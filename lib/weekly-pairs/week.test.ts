import { describe, expect, it } from "vitest";
import { checkInPhrases, currentPeriodStart, periodDays, periodEnd, weekRangeLabel } from "./week";

/** Afternoon UTC stays the same calendar day in Denver, before and after daylight saving. */
function on(iso: string) {
  return new Date(`${iso}T18:00:00Z`);
}

describe("coaching check-in periods", () => {
  it("stays one week through the week of Oct 12, 2026", () => {
    expect(currentPeriodStart(on("2026-10-05"))).toBe("2026-10-05");
    expect(currentPeriodStart(on("2026-10-11"))).toBe("2026-10-05");
    expect(weekRangeLabel("2026-10-05")).toBe("Oct 5 – 11");
    expect(periodDays("2026-10-05")).toBe(7);
    expect(periodEnd("2026-10-05")).toBe("2026-10-11");

    expect(currentPeriodStart(on("2026-10-12"))).toBe("2026-10-12");
    expect(currentPeriodStart(on("2026-10-18"))).toBe("2026-10-12");
    expect(weekRangeLabel("2026-10-12")).toBe("Oct 12 – 18");
    expect(checkInPhrases("2026-10-12").titleOpen).toBe("Who's in this week?");
    expect(checkInPhrases("2026-10-12").matchButton).toBe("Match this week");
  });

  it("opens a 14-day round on Oct 19 and every second Monday after that", () => {
    expect(currentPeriodStart(on("2026-10-19"))).toBe("2026-10-19");
    expect(currentPeriodStart(on("2026-10-25"))).toBe("2026-10-19");
    expect(currentPeriodStart(on("2026-11-01"))).toBe("2026-10-19");
    expect(periodDays("2026-10-19")).toBe(14);
    expect(periodEnd("2026-10-19")).toBe("2026-11-01");
    expect(weekRangeLabel("2026-10-19")).toBe("Oct 19 – Nov 1");

    expect(currentPeriodStart(on("2026-11-02"))).toBe("2026-11-02");
    expect(currentPeriodStart(on("2026-11-09"))).toBe("2026-11-02");
    expect(currentPeriodStart(on("2026-11-15"))).toBe("2026-11-02");
    expect(weekRangeLabel("2026-11-02")).toBe("Nov 2 – 15");
    expect(periodEnd("2026-11-02")).toBe("2026-11-15");

    expect(currentPeriodStart(on("2026-11-16"))).toBe("2026-11-16");
    expect(weekRangeLabel("2026-11-16")).toBe("Nov 16 – 29");
    expect(checkInPhrases("2026-10-19").titleOpen).toBe("Who's in for these two weeks?");
    expect(checkInPhrases("2026-10-19").in).toBe("You're in for these two weeks.");
    expect(checkInPhrases("2026-10-19").matchButton).toBe("Match these two weeks");
  });
});
