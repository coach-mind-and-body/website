import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// Mock the AI SDK generateObject
vi.mock("ai", () => ({
  generateObject: vi.fn().mockResolvedValue({
    object: {
      seoTitle: "Best Midlife Nutrition Tips for Women Over 40",
      seoDescription: "Discover proven nutrition strategies for women over 40. Learn how to balance hormones, boost energy, and achieve food freedom with expert coaching.",
      suggestedSlug: "midlife-nutrition-tips-women-over-40",
      titleSuggestion: "Midlife Nutrition: A Complete Guide for Women Over 40",
      excerptSuggestion: "Struggling with nutrition in midlife? Learn evidence-based strategies to balance hormones and find food freedom.",
      internalLinkSuggestions: [
        {
          anchorText: "R.E.C.L.A.I.M. coaching program",
          targetPath: "/reclaim",
          reason: "Links to the main coaching offering for readers interested in personalized help",
        },
      ],
      contentTips: [
        "Add more specific examples of hormone-friendly foods",
        "Include a section on common nutrition myths for midlife women",
        "Add statistics about metabolism changes after 40",
      ],
      focusKeywordSuggestions: [
        "midlife nutrition",
        "women over 40 diet",
        "hormone balance food",
      ],
    },
  }),
}));

// Mock the OpenAI setup
vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn().mockReturnValue({
    chat: vi.fn().mockReturnValue("mock-model"),
  }),
}));

vi.mock("./_core/patchedFetch", () => ({
  createPatchedFetch: vi.fn().mockReturnValue(fetch),
}));

describe("seoOptimizer.generateSuggestions", () => {
  it("returns SEO suggestions for admin users", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.seoOptimizer.generateSuggestions({
      title: "Nutrition Tips for Women Over 40",
      content: "<p>Here are some nutrition tips for women navigating midlife changes...</p>",
      slug: "nutrition-tips",
      seoTitle: "Nutrition Tips",
      seoDescription: "Tips for women",
      focusKeyword: "nutrition tips women 40",
      category: "nutrition",
      excerpt: "Nutrition tips for midlife women",
    });

    expect(result).toBeDefined();
    expect(result.seoTitle).toBeTruthy();
    expect(result.seoDescription).toBeTruthy();
    expect(result.suggestedSlug).toBeTruthy();
    expect(result.titleSuggestion).toBeTruthy();
    expect(result.excerptSuggestion).toBeTruthy();
    expect(Array.isArray(result.internalLinkSuggestions)).toBe(true);
    expect(Array.isArray(result.contentTips)).toBe(true);
    expect(Array.isArray(result.focusKeywordSuggestions)).toBe(true);
  });

  it("rejects non-admin users with FORBIDDEN error", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.seoOptimizer.generateSuggestions({
        title: "Test Post",
        content: "<p>Test content</p>",
        slug: "test-post",
      })
    ).rejects.toThrow(/Admins only|FORBIDDEN/);
  });

  it("returns all expected fields in the response", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.seoOptimizer.generateSuggestions({
      title: "Food Freedom Guide",
      content: "<p>Finding food freedom is about more than just what you eat...</p>",
      slug: "food-freedom-guide",
    });

    // Verify structure
    expect(typeof result.seoTitle).toBe("string");
    expect(typeof result.seoDescription).toBe("string");
    expect(typeof result.suggestedSlug).toBe("string");
    expect(typeof result.titleSuggestion).toBe("string");
    expect(typeof result.excerptSuggestion).toBe("string");

    // Verify arrays
    expect(result.internalLinkSuggestions.length).toBeGreaterThan(0);
    expect(result.internalLinkSuggestions[0]).toHaveProperty("anchorText");
    expect(result.internalLinkSuggestions[0]).toHaveProperty("targetPath");
    expect(result.internalLinkSuggestions[0]).toHaveProperty("reason");

    expect(result.contentTips.length).toBeGreaterThan(0);
    expect(result.focusKeywordSuggestions.length).toBeGreaterThan(0);
  });
});
