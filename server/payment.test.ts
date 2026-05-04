import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock Stripe to avoid real API calls
vi.mock("stripe", () => {
  const mockSession = {
    id: "cs_test_mock_session_123",
    url: "https://checkout.stripe.com/pay/cs_test_mock_session_123",
    payment_intent: "pi_test_mock_intent_123",
  };

  const MockStripe = vi.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue(mockSession),
      },
    },
  }));

  return { default: MockStripe };
});

// Mock DB to avoid real database calls
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: { origin: "https://example.com" },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("payment.createDepositCheckout", () => {
  it("returns a checkout URL for full plan", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.payment.createDepositCheckout({ plan: "full" });

    expect(result).toHaveProperty("url");
    expect(result.url).toContain("checkout.stripe.com");
  });

  it("returns a checkout URL for deposit plan", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.payment.createDepositCheckout({ plan: "deposit" });

    expect(result).toHaveProperty("url");
    expect(result.url).toContain("checkout.stripe.com");
  });

  it("defaults to full plan when no plan is specified", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.payment.createDepositCheckout({});

    expect(result).toHaveProperty("url");
  });

  it("rejects an invalid plan value", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.payment.createDepositCheckout({ plan: "invalid" as "full" })
    ).rejects.toThrow();
  });
});
