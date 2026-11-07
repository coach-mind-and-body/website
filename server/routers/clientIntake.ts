import { TRPCError } from "@trpc/server";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getClientIp, rateLimit } from "../../lib/rateLimit";
import { sendTransactionalEmail } from "../notifications";
import { deleteClientIntake, listClientIntakes, saveClientIntake } from "../clientIntake";
import { buildClientIntakeCoachEmail } from "../emails/clientIntake";
import {
  CLIENT_INTAKE_COACH_EMAIL,
  clientIntakeSchema,
  isClientIntakeHoneypot,
} from "@shared/clientIntake";
import { z } from "zod";

export const clientIntakeRouter = router({
  submit: publicProcedure.input(clientIntakeSchema).mutation(async ({ input, ctx }) => {
    const ip = getClientIp(ctx.req);
    const limit = rateLimit(`client-intake:${ip}`, 8, 60 * 60 * 1000);
    if (!limit.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many intakes from this connection. Please wait an hour and try again.",
      });
    }

    if (isClientIntakeHoneypot(input.companyWebsite)) {
      return { success: true as const, stored: false };
    }

    await saveClientIntake(input, "link");

    const coach = buildClientIntakeCoachEmail(input);
    try {
      const sent = await sendTransactionalEmail({
        to: CLIENT_INTAKE_COACH_EMAIL,
        toName: "Lee Anne",
        subject: coach.subject,
        htmlBody: coach.html,
        textBody: coach.text,
        replyTo: input.email,
      });
      if (!sent) {
        console.error("[Intake] Coach email was not sent for", input.email);
      }
    } catch (err) {
      console.error("[Intake] Coach email failed for", input.email, err);
    }

    return { success: true as const, stored: true };
  }),

  list: adminProcedure.query(async () => listClientIntakes()),

  create: adminProcedure.input(clientIntakeSchema).mutation(async ({ input }) => {
    await saveClientIntake(input, "portal");
    return { success: true as const };
  }),

  remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    await deleteClientIntake(input.id);
    return { success: true as const };
  }),
});
