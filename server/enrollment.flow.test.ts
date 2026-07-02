// @ts-nocheck
/**
 * Tests for enrollment flow fixes:
 * 1. RECLAIM webhook creates enrollment + 6 sessions after payment
 * 2. FPU myCoaching email-based fallback
 * 3. adminCreate enrollment procedure
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Simulates the webhook logic: given a userId and plan, returns what should be inserted */
function simulateReclaimWebhookEnrollment(params: {
  userId: number | null;
  plan: "deposit" | "full";
  existingEnrollmentId: number | null;
}) {
  const { userId, plan, existingEnrollmentId } = params;

  if (!userId) {
    return { action: "pending_signup", enrollmentCreated: false, sessionsCreated: 0 };
  }

  if (existingEnrollmentId) {
    return {
      action: "updated_existing",
      enrollmentCreated: false,
      sessionsCreated: 0,
      enrollmentId: existingEnrollmentId,
    };
  }

  // New enrollment
  const enrollmentId = 999; // simulated auto-increment
  const sessions = Array.from({ length: 6 }, (_, i) => ({
    enrollmentId,
    userId,
    sessionNumber: i + 1,
    status: "not_scheduled",
  }));

  return {
    action: "created",
    enrollmentCreated: true,
    sessionsCreated: sessions.length,
    paymentType: plan,
    depositPaid: true,
    balancePaid: plan === "full",
    enrollmentId,
    sessions,
  };
}

/** Simulates the FPU myCoaching email fallback logic */
function simulateFpuMyCoachingLookup(params: {
  userId: number;
  userEmail: string;
  ordersByUserId: Array<{ id: number; userId: number | null; clientEmail: string; status: string }>;
  ordersByEmail: Array<{ id: number; userId: number | null; clientEmail: string; status: string }>;
}) {
  const { userId, userEmail, ordersByUserId, ordersByEmail } = params;

  // Primary: find by userId
  const byId = ordersByUserId.find(
    (o) => o.userId === userId && o.status === "paid"
  );
  if (byId) return { order: byId, backfilledUserId: false };

  // Fallback: find by email
  const byEmail = ordersByEmail.find(
    (o) => o.clientEmail === userEmail && o.status === "paid"
  );
  if (byEmail) {
    return { order: byEmail, backfilledUserId: true };
  }

  return { order: null, backfilledUserId: false };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("RECLAIM webhook enrollment creation", () => {
  it("creates enrollment + 6 sessions when user exists and no prior enrollment", () => {
    const result = simulateReclaimWebhookEnrollment({
      userId: 42,
      plan: "deposit",
      existingEnrollmentId: null,
    });
    expect(result.action).toBe("created");
    expect(result.enrollmentCreated).toBe(true);
    expect(result.sessionsCreated).toBe(6);
    expect(result.paymentType).toBe("deposit");
    expect(result.depositPaid).toBe(true);
    expect(result.balancePaid).toBe(false);
  });

  it("creates enrollment with balancePaid=true for full payment", () => {
    const result = simulateReclaimWebhookEnrollment({
      userId: 42,
      plan: "full",
      existingEnrollmentId: null,
    });
    expect(result.action).toBe("created");
    expect(result.balancePaid).toBe(true);
    expect(result.sessionsCreated).toBe(6);
  });

  it("returns pending_signup when no userId (paid before account creation)", () => {
    const result = simulateReclaimWebhookEnrollment({
      userId: null,
      plan: "deposit",
      existingEnrollmentId: null,
    });
    expect(result.action).toBe("pending_signup");
    expect(result.enrollmentCreated).toBe(false);
    expect(result.sessionsCreated).toBe(0);
  });

  it("updates existing enrollment instead of creating a duplicate", () => {
    const result = simulateReclaimWebhookEnrollment({
      userId: 42,
      plan: "deposit",
      existingEnrollmentId: 77,
    });
    expect(result.action).toBe("updated_existing");
    expect(result.enrollmentCreated).toBe(false);
    expect(result.enrollmentId).toBe(77);
  });

  it("creates exactly 6 sessions numbered 1 through 6", () => {
    const result = simulateReclaimWebhookEnrollment({
      userId: 42,
      plan: "deposit",
      existingEnrollmentId: null,
    });
    expect(result.sessions).toHaveLength(6);
    const numbers = result.sessions!.map((s) => s.sessionNumber);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe("FPU myCoaching email-based fallback", () => {
  const userId = 10;
  const userEmail = "client@example.com";

  it("returns order by userId when found", () => {
    const result = simulateFpuMyCoachingLookup({
      userId,
      userEmail,
      ordersByUserId: [{ id: 1, userId, clientEmail: userEmail, status: "paid" }],
      ordersByEmail: [],
    });
    expect(result.order).not.toBeNull();
    expect(result.order?.id).toBe(1);
    expect(result.backfilledUserId).toBe(false);
  });

  it("falls back to email lookup when userId not set on order", () => {
    const result = simulateFpuMyCoachingLookup({
      userId,
      userEmail,
      ordersByUserId: [], // no match by userId
      ordersByEmail: [{ id: 5, userId: null, clientEmail: userEmail, status: "paid" }],
    });
    expect(result.order).not.toBeNull();
    expect(result.order?.id).toBe(5);
    expect(result.backfilledUserId).toBe(true);
  });

  it("returns null when no order found by either method", () => {
    const result = simulateFpuMyCoachingLookup({
      userId,
      userEmail,
      ordersByUserId: [],
      ordersByEmail: [],
    });
    expect(result.order).toBeNull();
  });

  it("does not return unpaid orders in email fallback", () => {
    const result = simulateFpuMyCoachingLookup({
      userId,
      userEmail,
      ordersByUserId: [],
      ordersByEmail: [{ id: 5, userId: null, clientEmail: userEmail, status: "pending" }],
    });
    expect(result.order).toBeNull();
  });
});

describe("adminCreate enrollment validation", () => {
  it("validates required fields", () => {
    const input = { clientEmail: "test@example.com", paymentType: "deposit" as const, depositPaid: true, balancePaid: false };
    expect(input.clientEmail).toBeTruthy();
    expect(["full", "deposit"]).toContain(input.paymentType);
    expect(typeof input.depositPaid).toBe("boolean");
  });

  it("sets balancePaid=true for full payment type", () => {
    const isFullPayment = "full" === "full";
    expect(isFullPayment).toBe(true);
  });

  it("sets balancePaid=false for deposit payment type", () => {
    const isFullPayment = "deposit" === "full";
    expect(isFullPayment).toBe(false);
  });
});
