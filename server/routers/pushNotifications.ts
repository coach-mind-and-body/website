import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { pushSubscriptions, enrollments, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import webpush from "web-push";

// Configure VAPID
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = "mailto:info@coachmindandbody.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export const pushNotificationsRouter = router({
  // Client subscribes to push notifications
  subscribe: protectedProcedure
    .input(z.object({
      endpoint: z.string().url(),
      p256dh: z.string(),
      auth: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      // Upsert: if same endpoint exists for this user, update it
      const existing = await db.select({ id: pushSubscriptions.id })
        .from(pushSubscriptions)
        .where(and(
          eq(pushSubscriptions.userId, ctx.user.id),
          eq(pushSubscriptions.endpoint, input.endpoint)
        ))
        .limit(1);
      if (existing.length > 0) {
        await db.update(pushSubscriptions)
          .set({ p256dh: input.p256dh, auth: input.auth })
          .where(eq(pushSubscriptions.id, existing[0].id));
      } else {
        await db.insert(pushSubscriptions).values({
          userId: ctx.user.id,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
        });
      }
      return { success: true };
    }),

  // Client unsubscribes
  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.delete(pushSubscriptions)
        .where(and(
          eq(pushSubscriptions.userId, ctx.user.id),
          eq(pushSubscriptions.endpoint, input.endpoint)
        ));
      return { success: true };
    }),

  // Check if current user has a push subscription
  status: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { subscribed: false };
    const subs = await db.select({ id: pushSubscriptions.id })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, ctx.user.id))
      .limit(1);
    return { subscribed: subs.length > 0 };
  }),

  // Admin: send push notification to a specific user (by userId)
  sendToUser: adminProcedure
    .input(z.object({
      userId: z.number(),
      title: z.string(),
      body: z.string(),
      url: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const subs = await db.select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, input.userId));
      if (subs.length === 0) return { sent: 0, message: "No push subscriptions found for this user" };

      const payload = JSON.stringify({
        title: input.title,
        body: input.body,
        url: input.url || "/dashboard",
        icon: "/favicon.ico",
      });

      let sent = 0;
      const failed: number[] = [];
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sent++;
        } catch (err: any) {
          console.warn(`[Push] Failed to send to sub ${sub.id}:`, err.statusCode || err.message);
          // If subscription is expired/invalid, remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
            failed.push(sub.id);
          }
        }
      }
      // Clean up expired subscriptions
      if (failed.length > 0) {
        for (const id of failed) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id));
        }
      }
      return { sent, failed: failed.length };
    }),

  // Admin: notify a client that a new document was shared
  notifyDocumentUploaded: adminProcedure
    .input(z.object({
      enrollmentId: z.number(),
      documentTitle: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Find the userId linked to this enrollment
      const [enrollment] = await db.select({
        userId: enrollments.userId,
      })
        .from(enrollments)
        .where(eq(enrollments.id, input.enrollmentId))
        .limit(1);

      const resolvedUserId: number | null = enrollment?.userId ?? null;

      if (!resolvedUserId) {
        return { sent: 0, message: "No linked client account found for this enrollment." };
      }

      const subs = await db.select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, resolvedUserId));

      if (subs.length === 0) {
        return { sent: 0, message: "Client has not enabled push notifications" };
      }

      const docName = input.documentTitle ? `"${input.documentTitle}"` : "a new document";
      const payload = JSON.stringify({
        title: "New Document from Your Coach 📄",
        body: `Your coach just shared ${docName} with you. Tap to view it.`,
        url: "/dashboard",
        icon: "/favicon.ico",
      });

      let sent = 0;
      const failed: number[] = [];
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sent++;
        } catch (err: any) {
          console.warn(`[Push] Failed to notify client sub ${sub.id}:`, err.statusCode || err.message);
          if (err.statusCode === 410 || err.statusCode === 404) failed.push(sub.id);
        }
      }
      if (failed.length > 0) {
        for (const id of failed) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id));
        }
      }
      return { sent, failed: failed.length, message: sent > 0 ? "Notification sent!" : "Client has not enabled push notifications" };
    }),

  // Get VAPID public key for frontend subscription
  vapidPublicKey: protectedProcedure.query(() => {
    return { publicKey: VAPID_PUBLIC_KEY };
  }),
});
