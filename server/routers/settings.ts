import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { siteSettings } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

function adminOnly(role: string | undefined) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
}

export const settingsRouter = router({
  /**
   * Public: get a setting by key (safe for frontend use)
   */
  get: publicProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ ctx, input }) => {
      const isSensitive =
        input.key.startsWith("private_") || input.key.toLowerCase().includes("secret");
      if (isSensitive && ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
      }

      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, input.key)).limit(1);
      return rows[0]?.value ?? null;
    }),

  /**
   * Admin: set a setting value
   */
  set: protectedProcedure
    .input(z.object({ key: z.string(), value: z.string() }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Upsert
      const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, input.key)).limit(1);
      if (existing.length > 0) {
        await db.update(siteSettings).set({ value: input.value }).where(eq(siteSettings.key, input.key));
      } else {
        await db.insert(siteSettings).values({ key: input.key, value: input.value });
      }
      return { success: true };
    }),
});
