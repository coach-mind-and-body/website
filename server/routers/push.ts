import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { pushSubscriptions, challenges } from "../../drizzle/schema";
import { eq, isNotNull } from "drizzle-orm";
import webpush from "web-push";

// Initialize web-push with VAPID keys
if (process.env.VITE_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:hello@mindandbodyresetcoach.com",
    process.env.VITE_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export const pushRouter = router({
  subscribe: publicProcedure
    .input(z.object({
      endpoint: z.string(),
      p256dh: z.string(),
      auth: z.string(),
      deviceId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");

      // Save subscription. Associate with userId if logged in, otherwise deviceId.
      await db.insert(pushSubscriptions).values({
        userId: ctx.user?.id || null,
        deviceId: input.deviceId || null,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
      });

      return { success: true };
    }),

  broadcastChallenge: adminProcedure
    .input(z.object({ challengeId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");

      const [challenge] = await db.select().from(challenges).where(eq(challenges.id, input.challengeId)).limit(1);
      if (!challenge) throw new Error("Challenge not found");

      const subs = await db.select().from(pushSubscriptions).where(isNotNull(pushSubscriptions.endpoint));

      const payload = JSON.stringify({
        title: "New Challenge Available! \uD83D\uDD25",
        body: challenge.title,
        url: "/habit-tracker",
      });

      let sentCount = 0;
      for (const sub of subs) {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          }, payload);
          sentCount++;
        } catch (e: any) {
          if (e.statusCode === 410) {
            // Subscription has expired or is no longer valid, we should delete it
            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
          }
          console.error("Error sending push:", e);
        }
      }

      return { success: true, sentCount };
    })
});
