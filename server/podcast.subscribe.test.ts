/**
 * podcast.subscribe should hand the address to Resend.
 * The old Mailchimp helper is gone; these tests follow resendSubscribe.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

vi.mock("./resendSubscribe", () => ({
  resendSubscribe: vi.fn(),
}));

import { resendSubscribe } from "./resendSubscribe";

function publicContext(): TrpcContext {
  return {
    user: null,
    req: new Request("https://mindandbodyresetcoach.com/midlife-health-podcast"),
  };
}

describe("podcast.subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resendSubscribe).mockResolvedValue({ success: true });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => "<feed></feed>",
      }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls resendSubscribe with the email and first name", async () => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.podcast.subscribe({
      email: "jane@example.com",
      firstName: "Jane",
    });

    expect(result).toEqual({ success: true });
    expect(resendSubscribe).toHaveBeenCalledTimes(1);
    expect(resendSubscribe).toHaveBeenCalledWith({
      email: "jane@example.com",
      firstName: "Jane",
    });
  });

  it("does not attach a blog subscriber tag", async () => {
    const caller = appRouter.createCaller(publicContext());
    await caller.podcast.subscribe({
      email: "user@example.com",
      firstName: "Pat",
    });

    const call = vi.mocked(resendSubscribe).mock.calls[0][0];
    expect(call.tags ?? []).not.toContain("blog_sub");
  });

  it("works without a first name", async () => {
    const caller = appRouter.createCaller(publicContext());
    await caller.podcast.subscribe({ email: "noname@example.com" });

    expect(resendSubscribe).toHaveBeenCalledWith({
      email: "noname@example.com",
      firstName: undefined,
    });
  });
});
