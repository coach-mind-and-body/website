import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { appUpdates, pushSubscriptions } from "../../drizzle/schema";
import { desc, eq } from "drizzle-orm";
import webpush from "web-push";

// Make sure VAPID details are set if we're broadcasting
const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails("mailto:leeanne@mindandbodyresetcoach.com", vapidPublic, vapidPrivate);
}

export const appUpdatesRouter = router({
  getUpdates: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(appUpdates).orderBy(desc(appUpdates.createdAt));
  }),

  createUpdateAndBroadcast: adminProcedure
    .input(z.object({
      title: z.string(),
      message: z.string(),
      videoUrl: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");

      // Insert the new update
      await db.insert(appUpdates).values({
        title: input.title,
        message: input.message,
        videoUrl: input.videoUrl || null,
      });

      // Broadcast to all subscribers
      const subs = await db.select().from(pushSubscriptions);
      const payload = JSON.stringify({
        title: "New Coach Update: " + input.title,
        body: input.message,
        url: "/habit-tracker" // The frontend route where they view it
      });

      let sentCount = 0;
      const promises = subs.map(async (sub) => {
        try {
          const subscription = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          };
          await webpush.sendNotification(subscription, payload);
          sentCount++;
        } catch (error) {
          console.error("Error sending push to", sub.endpoint, error);
        }
      });
      
      await Promise.allSettled(promises);

      return { success: true, sentCount };
    }),

  deleteUpdate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB Error");
      await db.delete(appUpdates).where(eq(appUpdates.id, input.id));
      return { success: true };
    })
});
