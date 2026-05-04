import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { leads } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";

function adminOnly(role: string | undefined) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
}

export const leadsRouter = router({
  // Public: submit discovery call interest
  submit: publicProcedure
    .input(z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Valid email required"),
      phone: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(leads).values(input);
      // Notify Lee Anne
      await notifyOwner({
        title: "New Discovery Call Lead",
        content: `${input.name} (${input.email}) just booked a discovery call.${input.phone ? ` Phone: ${input.phone}` : ""}`,
      });
      return { success: true };
    }),

  // Admin: list all leads
  list: protectedProcedure.query(async ({ ctx }) => {
    adminOnly(ctx.user?.role);
    const db = await getDb();
    if (!db) return [];
    return db.select().from(leads).orderBy(desc(leads.createdAt));
  }),

  // Admin: update lead status
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["new", "contacted", "enrolled", "not_a_fit"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const updateData: Record<string, unknown> = { status: input.status };
      if (input.notes !== undefined) updateData.notes = input.notes;
      await db.update(leads).set(updateData).where(eq(leads.id, input.id));
      return { success: true };
    }),
});
