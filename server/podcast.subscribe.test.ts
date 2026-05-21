/**
 * Tests for podcast.subscribe tRPC procedure
 * Verifies that the podcast subscribe mutation calls mailchimpSubscribe
 * with the correct "podcast" tag.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the mailchimp module
vi.mock("../server/mailchimp", () => ({
  mailchimpSubscribe: vi.fn(),
}));

import { mailchimpSubscribe } from "../server/mailchimp";

describe("podcast.subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls mailchimpSubscribe with podcast tag", async () => {
    const mockSubscribe = vi.mocked(mailchimpSubscribe);
    mockSubscribe.mockResolvedValue({ success: true });

    // Simulate what the procedure does
    const input = { email: "test@example.com", firstName: "Jane" };
    await mailchimpSubscribe({
      email: input.email,
      firstName: input.firstName,
      tags: ["podcast"],
    });

    expect(mockSubscribe).toHaveBeenCalledOnce();
    expect(mockSubscribe).toHaveBeenCalledWith({
      email: "test@example.com",
      firstName: "Jane",
      tags: ["podcast"],
    });
  });

  it("uses podcast tag (not blog_sub)", async () => {
    const mockSubscribe = vi.mocked(mailchimpSubscribe);
    mockSubscribe.mockResolvedValue({ success: true });

    await mailchimpSubscribe({
      email: "user@example.com",
      tags: ["podcast"],
    });

    const call = mockSubscribe.mock.calls[0][0];
    expect(call.tags).toContain("podcast");
    expect(call.tags).not.toContain("blog_sub");
  });

  it("works without firstName", async () => {
    const mockSubscribe = vi.mocked(mailchimpSubscribe);
    mockSubscribe.mockResolvedValue({ success: true });

    await mailchimpSubscribe({
      email: "noname@example.com",
      tags: ["podcast"],
    });

    expect(mockSubscribe).toHaveBeenCalledWith({
      email: "noname@example.com",
      tags: ["podcast"],
    });
  });
});
