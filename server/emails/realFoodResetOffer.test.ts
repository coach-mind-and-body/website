import { describe, expect, it } from "vitest";
import {
  REAL_FOOD_RESET_OFFER_DATES,
  REAL_FOOD_RESET_OFFER_EMAILS,
} from "./realFoodResetOffer";
import { REAL_FOOD_RESET_DAY_DATES, REAL_FOOD_RESET_DAY_EMAILS } from "./realFoodReset";

describe("real food reset sequences", () => {
  it("has a matching reminder + daily email for each calendar date", () => {
    expect(REAL_FOOD_RESET_DAY_EMAILS.length).toBe(REAL_FOOD_RESET_DAY_DATES.length);
    expect(REAL_FOOD_RESET_DAY_DATES[0]).toBe("2026-09-24");
    expect(REAL_FOOD_RESET_DAY_DATES.at(-1)).toBe("2026-10-02");
  });

  it("has five post-challenge offer emails after the challenge", () => {
    expect(REAL_FOOD_RESET_OFFER_EMAILS.length).toBe(5);
    expect(REAL_FOOD_RESET_OFFER_DATES.length).toBe(5);
    expect(REAL_FOOD_RESET_OFFER_DATES[0]).toBe("2026-10-03");
    const first = REAL_FOOD_RESET_OFFER_EMAILS[0]("Sarah");
    expect(first.subject).toContain("five days");
    expect(first.html).toContain("logo-horizontal.jpg");
    expect(first.html).toContain("habit-tracker");
    const pitch = REAL_FOOD_RESET_OFFER_EMAILS[1]("Sarah");
    expect(pitch.html).toContain("$597");
    expect(pitch.html).toContain("reclaim-invite");
  });
});
