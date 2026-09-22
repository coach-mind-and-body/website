import { describe, expect, it } from "vitest";
import {
  REAL_FOOD_RESET_OFFER_DATES,
  REAL_FOOD_RESET_OFFER_EMAILS,
} from "./realFoodResetOffer";
import { REAL_FOOD_RESET_DAY_DATES, REAL_FOOD_RESET_DAY_EMAILS } from "./realFoodReset";

describe("real food reset sequences", () => {
  it("has a matching reminder + daily email for each calendar date", () => {
    expect(REAL_FOOD_RESET_DAY_EMAILS.length).toBe(REAL_FOOD_RESET_DAY_DATES.length);
    expect(REAL_FOOD_RESET_DAY_DATES[0]).toBe("2026-09-22");
    expect(REAL_FOOD_RESET_DAY_DATES.at(-1)).toBe("2026-10-02");
    const day1 = REAL_FOOD_RESET_DAY_EMAILS[6]("Sarah");
    expect(day1.html).toContain("NOTICE");
    expect(day1.html).toContain("SWAP ONE");
    const day5 = REAL_FOOD_RESET_DAY_EMAILS[REAL_FOOD_RESET_DAY_EMAILS.length - 1]("Sarah");
    expect(day5.html).toContain("/book");
    expect(day5.html).toContain("reclaim-invite");
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
    expect(pitch.html).toContain("/book");
    const day5 = REAL_FOOD_RESET_DAY_EMAILS[REAL_FOOD_RESET_DAY_EMAILS.length - 1]("Sarah");
    expect(day5.html).toContain("/book");
  });
});
