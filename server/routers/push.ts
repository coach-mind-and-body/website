import { z } from "zod";
import webpush from "web-push";
import { adminProcedure, publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { challenges, pushSubscriptions, users } from "../../drizzle/schema";
import { eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";


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

const DEFAULT_ADMIN_URL = "/admin?tab=contacts";

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
      .where(inArray(pushSubscriptions.userId, adminIds));

    // For each subscription, send the notification
    const message = JSON.stringify({
      ...payload,
      url: payload.url ?? DEFAULT_ADMIN_URL,
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

    const adminIds = adminUsers.map((a) => a.id);
    const allSubs = await db
      .select()
      .from(pushSubscriptions)
      .where(inArray(pushSubscriptions.userId, adminIds));

    if (!allSubs.length) return;

    const message = JSON.stringify({
      ...payload,
      url: payload.url ?? DEFAULT_ADMIN_URL,
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
  getPublicKey: publicProcedure.query(() => {
    return { publicKey: VAPID_PUBLIC_KEY };
  }),

  // Save a push subscription from a device (logged-in or anonymous)
  subscribe: publicProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
        p256dh: z.string(),
        auth: z.string(),
        deviceId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, input.endpoint))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(pushSubscriptions)
          .set({
            p256dh: input.p256dh,
            auth: input.auth,
            userId: ctx.user?.id ?? existing[0].userId,
            deviceId: input.deviceId ?? existing[0].deviceId,
          })
          .where(eq(pushSubscriptions.endpoint, input.endpoint));
      } else {
        await db.insert(pushSubscriptions).values({
          userId: ctx.user?.id ?? null,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
          deviceId: input.deviceId ?? null,
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
      url: DEFAULT_ADMIN_URL,
    });
    return { success: true };
  }),

  // Admin: broadcast a challenge push to all subscribed devices
  broadcastChallenge: adminProcedure
    .input(z.object({ challengeId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [challenge] = await db
        .select()
        .from(challenges)
        .where(eq(challenges.id, input.challengeId))
        .limit(1);

      if (!challenge) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Challenge not found" });
      }

      const subs = await db.select().from(pushSubscriptions);
      const payload = JSON.stringify({
        title: `New Challenge: ${challenge.title}`,
        body: challenge.description || "Join the challenge in the Habit Tracker!",
        url: "/habit-tracker",
      });

      let sentCount = 0;
      const promises = subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
          sentCount++;
        } catch (error: unknown) {
          const statusCode = (error as { statusCode?: number })?.statusCode;
          console.error("[Push] Error sending challenge broadcast to", sub.endpoint, error);
          if (statusCode === 410 || statusCode === 404) {
            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
          }
        }
      });

      await Promise.allSettled(promises);

      return { success: true, sentCount };
    }),
});
