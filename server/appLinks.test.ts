import { describe, expect, it } from "vitest";
import {
  APPLE_APP_ID,
  COACH_APP_URL,
  FOOD_APP_URL,
  PORTAL_HUB_URL,
  UNIVERSAL_LINK_PATHS,
  appleAppSiteAssociation,
  challengeAppUrl,
  formAppUrl,
} from "@shared/appLinks";
import { GET } from "../app/.well-known/apple-app-site-association/route";

describe("apple app site association", () => {
  it("names the habit tracker app and only app paths", () => {
    const file = appleAppSiteAssociation();
    expect(file.applinks.details[0].appID).toBe("8D3TJ8W8XK.com.mindandbodyreset.habittracker");
    expect(APPLE_APP_ID).toBe(file.applinks.details[0].appID);
    expect(UNIVERSAL_LINK_PATHS).toEqual(expect.arrayContaining(["/habit-tracker", "/habit-tracker/*", "/portal", "/portal/*"]));
    const joined = UNIVERSAL_LINK_PATHS.join(" ");
    expect(joined).not.toContain("/reclaim");
    expect(joined).not.toContain("/book");
    expect(joined).not.toContain("/food-quiz");
    expect(joined).not.toContain("/health-wellness-blog");
  });

  it("serves json with no redirect", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("location")).toBeNull();
    const body = await response.json();
    expect(body.applinks.details[0].paths).toContain("/portal/*");
  });

  it("builds the app urls emails already use", () => {
    expect(COACH_APP_URL).toBe("https://mindandbodyresetcoach.com/habit-tracker/coach");
    expect(FOOD_APP_URL).toBe("https://mindandbodyresetcoach.com/habit-tracker/calories");
    expect(PORTAL_HUB_URL).toBe("https://mindandbodyresetcoach.com/portal/hub");
    expect(formAppUrl(12)).toBe("https://mindandbodyresetcoach.com/portal/forms/12");
    const challenge = new URL(challengeAppUrl("abc 1"));
    expect(challenge.pathname).toBe("/habit-tracker");
    expect(challenge.searchParams.get("focus")).toBe("challenge");
    expect(challenge.searchParams.get("claim")).toBe("abc 1");
  });
});
