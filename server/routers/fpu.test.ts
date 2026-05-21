import { describe, it, expect, vi } from "vitest";

// Mock Stripe
vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            id: "cs_test_mock_session_123",
            url: "https://checkout.stripe.com/pay/cs_test_mock_session_123",
            payment_intent: "pi_test_mock_123",
          }),
        },
      },
    })),
  };
});

// Mock DB
vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  }),
}));

// Mock ENV
vi.mock("../_core/env", () => ({
  ENV: {
    stripeSecretKey: "sk_test_mock",
    stripeWebhookSecret: "whsec_test_mock",
  },
}));

import { fpuRouter, FPU_PRODUCT, FPU_COACHING_PRODUCT } from "./fpu";

describe("FPU Router", () => {
  describe("FPU_PRODUCT constants", () => {
    it("FPU class should be free (price = 0)", () => {
      expect(FPU_PRODUCT.price).toBe(0);
      expect(FPU_PRODUCT.displayPrice).toBe("Free");
    });

    it("FPU class should have a product name containing 'Financial Peace'", () => {
      expect(FPU_PRODUCT.name).toBeTruthy();
      expect(FPU_PRODUCT.name).toContain("Financial Peace");
    });
  });

  describe("FPU_COACHING_PRODUCT constants", () => {
    it("coaching add-on should cost $249 (24900 cents)", () => {
      expect(FPU_COACHING_PRODUCT.price).toBe(24900);
      expect(FPU_COACHING_PRODUCT.displayPrice).toBe("$249");
    });

    it("coaching add-on should include 3 sessions", () => {
      expect(FPU_COACHING_PRODUCT.sessionCount).toBe(3);
    });

    it("coaching add-on should have a descriptive name", () => {
      expect(FPU_COACHING_PRODUCT.name).toBeTruthy();
      expect(FPU_COACHING_PRODUCT.name.toLowerCase()).toContain("coaching");
    });
  });

  describe("fpuRouter procedures", () => {
    it("should export createCoachingCheckout, createCheckout, and checkSession", () => {
      expect(fpuRouter).toBeDefined();
      expect(fpuRouter._def.procedures).toHaveProperty("createCoachingCheckout");
      expect(fpuRouter._def.procedures).toHaveProperty("createCheckout");
      expect(fpuRouter._def.procedures).toHaveProperty("checkSession");
    });
  });
});
