// @ts-nocheck
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

const deletedCookies: string[] = [];

vi.mock("next/headers", () => ({
  cookies: async () => ({
    delete: (name: string) => {
      deletedCookies.push(name);
    },
  }),
}));

import { appRouter } from "./routers";

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "sample-user",
      email: "sample@example.com",
      name: "Sample User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: new Request("https://example.com"),
  };
}

describe("auth.logout", () => {
  beforeEach(() => {
    deletedCookies.length = 0;
  });

  it("clears the session cookie and reports success", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(deletedCookies).toEqual([COOKIE_NAME]);
  });
});
