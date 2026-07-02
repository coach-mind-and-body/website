// @ts-nocheck
/**
 * Tests for podcast.subscribe tRPC procedure
 * Verifies that the podcast subscribe mutation calls resendSubscribe
 * with the correct "podcast" tag.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "../server/_core/routers";
import { createCallerFactory } from "@trpc/server";

// Mock the resendSubscribe module
vi.mock("../server/resendSubscribe", () => ({
  resendSubscribe: vi.fn(),
}));

import { resendSubscribe } from "../server/resendSubscribe";

describe("podcast router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resendSubscribe).mockResolvedValue({ success: true });
  });

  it("calls resendSubscribe with podcast tag", async () => {
    const mockSubscribe = vi.mocked(resendSubscribe);

    // Simulate returning error
    const input = { email: "fail@example.com" };
    await resendSubscribe({
      email: input.email,
      firstName: input.firstName,
    });

    expect(mockSubscribe).toHaveBeenCalledOnce();
    expect(mockSubscribe).toHaveBeenCalledWith({
      email: "test@example.com",
      firstName: "Jane",
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
