import { getDb } from "./db";
import { subscribers, sequenceEnrollments } from "../drizzle/schema";
import { eq, and, isNull, lte } from "drizzle-orm";
import { FPU_EMAILS } from "./emails/fpuNewsletters";
import { sendTransactionalEmail } from "./notifications";

export async function processEmailSequences() {
  console.log("[Sequences] Starting daily sequence processor...");
  let emailsSent = 0;

  // 1. Fetch all active enrollments that are due for an email
  // A subscriber is due if:
  //   - They have never received an email (lastEmailedAt is null)
  //   - Or they received an email 7+ days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const db = await getDb();
  if (!db) return { success: false, error: "DB unavailable" };

  const activeEnrollments = await db
    .select({
      enrollment: sequenceEnrollments,
      subscriber: subscribers,
    })
    .from(sequenceEnrollments)
    .innerJoin(subscribers, eq(sequenceEnrollments.subscriberId, subscribers.id))
    .where(
      and(
        eq(sequenceEnrollments.status, "active"),
        eq(sequenceEnrollments.sequenceId, "fpu_babystep_1")
      )
    );

  for (const { enrollment, subscriber } of activeEnrollments) {
    const isFirstEmail = !enrollment.lastEmailedAt;
    const isDueForNext = enrollment.lastEmailedAt && new Date(enrollment.lastEmailedAt) <= sevenDaysAgo;

    if (isFirstEmail || isDueForNext) {
      const stepIndex = enrollment.currentStep; // 0-indexed

      if (stepIndex >= FPU_EMAILS.length) {
        // Sequence completed!
        await db
          .update(sequenceEnrollments)
          .set({ status: "completed", updatedAt: new Date() })
          .where(eq(sequenceEnrollments.id, enrollment.id));
        continue;
      }

      // Generate the email content
      const getEmailContent = FPU_EMAILS[stepIndex];
      const emailContent = getEmailContent(subscriber.firstName || "Friend");

      console.log(`[Sequences] Sending FPU Email ${stepIndex + 1} to ${subscriber.email}`);
      
      const success = await sendTransactionalEmail({
        to: subscriber.email,
        toName: `${subscriber.firstName || ""} ${subscriber.lastName || ""}`.trim() || "Friend",
        subject: emailContent.subject,
        htmlBody: emailContent.html,
        textBody: "Please view this email in an HTML-compatible client.", // Fallback
      });

      if (success) {
        emailsSent++;
        await db
          .update(sequenceEnrollments)
          .set({
            currentStep: stepIndex + 1,
            lastEmailedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(sequenceEnrollments.id, enrollment.id));
      }
    }
  }

  console.log(`[Sequences] Processor finished. Sent ${emailsSent} emails.`);
  return { success: true, emailsSent };
}
