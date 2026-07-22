import { publicProcedure, router } from "../_core/trpc";
import { processHabitReminders } from "../habitReminders";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

function assertCronAuthorized(secret?: string | null) {
  const expected = process.env.CRON_SECRET;
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    if (!expected) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "CRON_SECRET not configured" });
    }
    if (secret !== expected) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }
    return;
  }

  // Dev: if CRON_SECRET is set, require it; otherwise allow local testing.
  if (expected && secret !== expected) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }
}

export const cronRouter = router({
  processReminders: publicProcedure
    .input(z.object({ secret: z.string().optional() }).optional())
    .mutation(async ({ input }) => {
      assertCronAuthorized(input?.secret);
      return processHabitReminders();
    }),
});
