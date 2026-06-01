import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { resendSubscribe } from "../resendSubscribe";
import { sendSnackHackEmail } from "../notifications";

export const leadgenRouter = router({
  subscribeSnackHack: publicProcedure
    .input(z.object({
      email: z.string().email(),
      firstName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // 1. Subscribe to Resend Audience
      const result = await resendSubscribe({
        email: input.email,
        firstName: input.firstName,
      });

      if (!result.success) {
        console.error("[LeadGen] Resend subscribe error:", result.error);
      }

      // 1.5 Add to internal subscribers table
      try {
        const { getDb } = await import("../db");
        const { subscribers } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (db) {
          const existingSub = await db.select().from(subscribers).where(eq(subscribers.email, input.email)).limit(1);
          if (existingSub.length > 0) {
            const currentSegments = existingSub[0].segments ? JSON.parse(existingSub[0].segments) : [];
            if (!currentSegments.includes("leadgen_snack_hack")) {
              currentSegments.push("leadgen_snack_hack");
              await db.update(subscribers).set({ segments: JSON.stringify(currentSegments) }).where(eq(subscribers.id, existingSub[0].id));
            }
          } else {
            await db.insert(subscribers).values({
              email: input.email,
              firstName: input.firstName,
              segments: JSON.stringify(["leadgen_snack_hack"]),
            });
          }
        }
      } catch (e) {
        console.error("Failed to add to internal subscribers:", e);
      }

      // 2. Send the Snack Hack PDF email
      await sendSnackHackEmail({
        clientEmail: input.email,
        clientName: input.firstName || "Friend",
      });

      return { success: true };
    }),
});
