import { describe, expect, it } from "vitest";
import {
  RESEND_AUDIENCE_SEGMENTS,
  usesMarketingBroadcast,
} from "./resendAudienceSync";

describe("Resend audience segments", () => {
  it("keeps the free plan's three segments and leaves the small lists one-to-one", () => {
    expect(RESEND_AUDIENCE_SEGMENTS.map((row) => [row.group, row.name])).toEqual([
      ["snack_hack", "Snack Hack"],
      ["health", "Health"],
      ["all", "General"],
    ]);
    expect(usesMarketingBroadcast("snack_hack")).toBe(true);
    expect(usesMarketingBroadcast("health")).toBe(true);
    expect(usesMarketingBroadcast("all")).toBe(true);
    expect(usesMarketingBroadcast("finance")).toBe(false);
    expect(usesMarketingBroadcast("real_food_reset")).toBe(false);
  });
});
