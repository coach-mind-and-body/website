import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { messageTemplates } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const templatesRouter = router({
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return await db.select().from(messageTemplates);
  }),
  create: adminProcedure
    .input(z.object({ name: z.string(), text: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB error");
      await db.insert(messageTemplates).values({
        name: input.name,
        text: input.text
      });
      return { success: true };
    }),
  update: adminProcedure
    .input(z.object({ id: z.number(), name: z.string(), text: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB error");
      await db.update(messageTemplates)
        .set({ name: input.name, text: input.text })
        .where(eq(messageTemplates.id, input.id));
      return { success: true };
    }),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB error");
      await db.delete(messageTemplates).where(eq(messageTemplates.id, input.id));
      return { success: true };
    })
});
