import { describe, it, expect } from "vitest";
import { mailchimpSubscribe } from "./mailchimp";

describe("Mailchimp integration", () => {
  it("should successfully subscribe a test email with blog_sub tag", async () => {
    // Use a deterministic test address that won't cause issues
    const result = await mailchimpSubscribe({
      email: "test-blog-sub@mindandbodyreset.test",
      firstName: "Test",
      tags: ["blog_sub"],
    });
    // We expect success: true — if credentials are wrong this will fail
    expect(result.success).toBe(true);
  }, 15000);
});
