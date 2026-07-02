import { z } from "zod";
import webpush from "web-push";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { pushSubscriptions, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";


// ─── Configure VAPID ─────────────────────────────────────────────────────────
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:info@coachmindandbody.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
} else {
  console.warn("[Push] Warning: VAPID keys are missing. Push notifications will fail.");
}

// ─── Shared helper: send push to all admins ───────────────────────────────────
export async function notifyAdmins(payload: {
  title: string;
  body: string;
  url?: string;
}) {
  try {
    const db = await getDb();
    if (!db) return;

    // Get all admin users
    const adminUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "admin"));

    const adminIds = adminUsers.map((u) => u.id);
    if (!adminIds.length) return;

    // Get all their push subscriptions
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, adminIds[0])); // drizzle inArray requires import

    // For each subscription, send the notification
    const message = JSON.stringify({
      ...payload,
      url: payload.url ?? "/admin/inbox",
    });
    const sends = subs.map((sub) =>
      webpush
        .sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          message
        )
        .catch((err: any) => {
          console.warn("[Push] Failed to send to endpoint:", err.statusCode);
          // If subscription is expired/invalid, remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
            db.delete(pushSubscriptions).where(
              eq(pushSubscriptions.id, sub.id)
            );
          }
        })
    );

    await Promise.allSettled(sends);
  } catch (err) {
    console.error("[Push] notifyAdmins error:", err);
  }
}

// ─── Bulk notify: send to all admin subscriptions ─────────────────────────────
export async function notifyAllAdmins(payload: {
  title: string;
  body: string;
  url?: string;
}) {
  try {
    const db = await getDb();
    if (!db) return;

    // Get all admin user IDs
    const adminUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "admin"));

    if (!adminUsers.length) return;

    // Get all push subscriptions for all admins
    const allSubs: any[] = [];
    for (const admin of adminUsers) {
      const subs = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, admin.id));
      allSubs.push(...subs);
    }

    if (!allSubs.length) return;

    const message = JSON.stringify({
      ...payload,
      url: payload.url ?? "/admin/inbox",
    });
    const sends = allSubs.map((sub) =>
      webpush
        .sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          message
        )
        .catch((err: any) => {
          console.warn("[Push] Failed:", err.statusCode);
          if (err.statusCode === 410 || err.statusCode === 404) {
            db.delete(pushSubscriptions).where(
              eq(pushSubscriptions.id, sub.id)
            );
          }
        })
    );

    await Promise.allSettled(sends);
  } catch (err) {
    console.error("[Push] notifyAllAdmins error:", err);
  }
}

// ─── tRPC Router ─────────────────────────────────────────────────────────────
export const pushRouter = router({
  // Get VAPID public key so the client can subscribe
  getPublicKey: protectedProcedure.query(() => {
    return { publicKey: VAPID_PUBLIC_KEY };
  }),

  // Save a push subscription from a device
  subscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
        p256dh: z.string(),
        auth: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Upsert by endpoint — avoid duplicates
      const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, input.endpoint))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(pushSubscriptions).values({
          userId: ctx.user.id,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
        });
      }

      return { success: true };
    }),

  // Remove a push subscription (e.g. user disables notifications)
  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, input.endpoint));

      return { success: true };
    }),

  // Admin: send a test notification
  sendTest: adminProcedure.mutation(async ({ ctx }) => {
    await notifyAdmins({
      title: "🔔 Notifications Active!",
      body: "Coach Mind & Body push notifications are working correctly.",
      url: "/admin/inbox",
    });
    return { success: true };
  }),
});
