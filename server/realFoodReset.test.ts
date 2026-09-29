import { describe, expect, it } from "vitest";
import { challengeLiveMeetOpen } from "@shared/realFoodReset";

describe("challengeLiveMeetOpen", () => {
  it("stays open through the 1:00 hour", () => {
    expect(challengeLiveMeetOpen("09:00", false)).toBe(true);
    expect(challengeLiveMeetOpen("13:00", false)).toBe(true);
    expect(challengeLiveMeetOpen("13:59", false)).toBe(true);
  });

  it("closes at 2:00 pm Mountain", () => {
    expect(challengeLiveMeetOpen("14:00", false)).toBe(false);
    expect(challengeLiveMeetOpen("18:30", false)).toBe(false);
  });

  it("closes as soon as a replay is posted", () => {
    expect(challengeLiveMeetOpen("13:10", true)).toBe(false);
  });
});
