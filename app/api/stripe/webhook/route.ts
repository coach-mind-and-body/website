import { NextResponse } from "next/server";
import Stripe from "stripe";
import { fireMetaPixelPurchase } from "@/server/metaCapi";
import { metaParamsFromStripeMetadata } from "@/server/metaParamBuilder";
import { ENV } from "@/server/_core/env";
import { getDb } from "@/server/db";
import { deposits, fpuOrders, fpuCoachingSessions, enrollments, coachingSessions, users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "@/server/_core/notification";
import { sendOwnerEmail, sendReclaimWelcomeEmail, sendFpuWelcomeEmail } from "@/server/notifications";
import { enrollUserInSequence } from "@/server/sequences";

async function firePurchaseFromSession(
  session: Stripe.Checkout.Session,
  params: {
    value: number;
    currency: string;
    content_name: string;
    content_category: string;
    customerEmail?: string | null;
    customerName?: string | null;
  }
) {
  const meta = metaParamsFromStripeMetadata(session.metadata ?? undefined);
  await fireMetaPixelPurchase({
    ...params,
    fbc: meta.fbc,
    fbp: meta.fbp,
    eventId: meta.eventId,
  });
}
function getStripe() {
  return new Stripe(ENV.stripeSecretKey, { apiVersion: "2026-02-25.clover" });
}

const RECLAIM_SESSION_LABELS = [
  "Discovery & Reset Foundation",
  "Food Noise & Mindset Mapping",
  "Hormones, Hunger & Habits",
  "Movement & Energy Reset",
  "Emotional Eating & Identity",
  "Integration & Your Life Forward",
];

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return new NextResponse('Missing signature', { status: 400 });
  const bodyText = await req.text();
  let event: Stripe.Event;

  try {
        const stripe = getStripe();
        event = stripe.webhooks.constructEvent(
          bodyText,
          sig as string,
          ENV.stripeWebhookSecret
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[Stripe Webhook] Signature verification failed:", message);
        return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
      }

      // Handle test events â€” required for webhook verification in test mode
      if (event.id.startsWith("evt_test_")) {
        console.log("[Stripe Webhook] Test event detected, returning verification response");
        return NextResponse.json({ verified: true });
      }

      console.log(`[Stripe Webhook] Event: ${event.type} | ID: ${event.id}`);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const db = await getDb();
        if (db && session.id) {
          const product = session.metadata?.product;
          try {
            if (product === "fpu" || product === "fpu_coaching") {
              // FPU coaching add-on (or legacy FPU class enrollment)
              await db
                .update(fpuOrders)
                .set({
                  status: "paid",
                  stripePaymentIntentId: session.payment_intent as string ?? null,
                })
                .where(eq(fpuOrders.stripeSessionId, session.id));
              const isCoaching = product === "fpu_coaching";
              
              const clientName = session.customer_details?.name ?? session.metadata?.customer_name ?? "Someone";
              const clientEmail = session.customer_details?.email ?? session.metadata?.customer_email ?? "no email";

              // Fire Meta Conversions API Purchase event
              const amount = session.amount_total ?? (isCoaching ? 24900 : 0); // FPU coaching is $249
              if (amount > 0) {
                await firePurchaseFromSession(session, {
                  value: amount,
                  currency: session.currency?.toUpperCase() ?? "USD",
                  content_name: isCoaching ? "FPU 1:1 Coaching Sessions" : "Financial Peace University",
                  content_category: "Coaching Program",
                  customerEmail: clientEmail !== "no email" ? clientEmail : null,
                  customerName: clientName !== "Someone" ? clientName : null,
                });
              }
              // Send welcome email to client
              await sendFpuWelcomeEmail({
                clientEmail,
                clientName,
                includesCoaching: isCoaching,
              });
              // Send Manus in-app notification
              await notifyOwner({
                title: isCoaching ? `New FPU Coaching Purchase â€” ${clientName}!` : `New FPU Enrollment â€” ${clientName}!`,
                content: isCoaching
                  ? `${clientName} (${clientEmail}) just purchased 3 FPU 1:1 coaching sessions ($249). A welcome email with your booking link has been sent to them â€” they'll schedule their first session directly!`
                  : `${clientName} (${clientEmail}) just enrolled in Financial Peace University.`,
              });
              // Create 3 coaching session records for tracking
              if (isCoaching) {
                // Find the fpuOrder id we just updated
                const [order] = await db
                  .select({ id: fpuOrders.id })
                  .from(fpuOrders)
                  .where(eq(fpuOrders.stripeSessionId, session.id))
                  .limit(1);
                if (order) {
                  await db.insert(fpuCoachingSessions).values([
                    { fpuOrderId: order.id, clientEmail, clientName, sessionNumber: 1 },
                    { fpuOrderId: order.id, clientEmail, clientName, sessionNumber: 2 },
                    { fpuOrderId: order.id, clientEmail, clientName, sessionNumber: 3 },
                  ]);
                  console.log(`[Stripe] Created 3 FPU coaching sessions for ${clientEmail}`);
                }
              }
              // Send detailed owner email â€” different content for coaching vs group class
              if (isCoaching) {
                const htmlBody = `
                  <div style="font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
                    <div style="background:#c9a96e;padding:28px 40px;text-align:center;">
                      <h1 style="margin:0;color:white;font-size:22px;font-weight:700;">New FPU 1:1 Coaching Client! ðŸŽ‰</h1>
                    </div>
                    <div style="padding:32px 40px;">
                      <p style="color:#4a4a4a;font-size:16px;">Hi Lee Anne! You have a new FPU 1:1 coaching client who just purchased 3 personal sessions:</p>
                      <div style="background:#f9f5f0;border-left:4px solid #c9a96e;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0;">
                        <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#3a5a3a;">${clientName}</p>
                        <p style="margin:0;font-size:16px;color:#4a4a4a;"><strong>Email:</strong> <a href="mailto:${clientEmail}" style="color:#c9a96e;">${clientEmail}</a></p>
                        <p style="margin:8px 0 0;font-size:14px;color:#6a6a6a;">Purchased: 3 x 50-min 1:1 coaching sessions ($249)</p>
                      </div>
                      <div style="background:#f4f8f4;border:1px solid #c8dcc8;border-radius:10px;padding:20px 24px;margin:20px 0;">
                        <p style="margin:0 0 10px;font-size:15px;font-weight:700;color:#3a5a3a;">Next Step: They'll book their sessions directly with you</p>
                        <p style="margin:0;font-size:14px;color:#4a4a4a;">A welcome email has already been sent to <strong>${clientEmail}</strong> with your booking link so they can schedule their first 1:1 coaching session at their convenience.</p>
                        <p style="margin:12px 0 0;font-size:14px;color:#4a4a4a;">You can also reach out directly to welcome them personally: <a href="mailto:${clientEmail}" style="color:#c9a96e;font-weight:600;">${clientEmail}</a></p>
                      </div>
                      <hr style="border:none;border-top:1px solid #e8e0d8;margin:28px 0;" />
                      <p style="color:#8a9a8a;font-size:13px;text-align:center;">Mind &amp; Body Reset &middot; <a href="https://mindandbodyresetcoach.com" style="color:#c9a96e;">mindandbodyresetcoach.com</a></p>
                    </div>
                  </div>
                `;
                const textBody = `New FPU 1:1 Coaching Client!\n\nName: ${clientName}\nEmail: ${clientEmail}\nPurchased: 3 x 50-min 1:1 coaching sessions ($249)\n\nA welcome email has been sent to ${clientEmail} with your booking link. They'll schedule their first session directly. You can also reach out personally to welcome them!`;
                await sendOwnerEmail({
                  subject: `New FPU 1:1 Coaching Client: ${clientName} â€” $249`,
                  htmlBody,
                  textBody,
                });
              } else {
                // Regular FPU group class â€” remind Lee Anne to add client to Tuesday recurring event
                const fpuGroupHtml = `
                  <div style="font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
                    <div style="background:#c9a96e;padding:28px 40px;text-align:center;">
                      <h1 style="margin:0;color:white;font-size:22px;font-weight:700;">New FPU Group Enrollment! ðŸŽ‰</h1>
                    </div>
                    <div style="padding:32px 40px;">
                      <p style="color:#4a4a4a;font-size:16px;">Hi Lee Anne! You have a new Financial Peace University student:</p>
                      <div style="background:#f9f5f0;border-left:4px solid #c9a96e;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0;">
                        <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#3a5a3a;">${clientName}</p>
                        <p style="margin:0;font-size:16px;color:#4a4a4a;"><strong>Email:</strong> <a href="mailto:${clientEmail}" style="color:#c9a96e;">${clientEmail}</a></p>
                        <p style="margin:8px 0 0;font-size:14px;color:#6a6a6a;">Enrolled in: Financial Peace University Group Class</p>
                      </div>
                      <div style="background:#f4f8f4;border:1px solid #c8dcc8;border-radius:10px;padding:20px 24px;margin:20px 0;">
                        <p style="margin:0 0 10px;font-size:15px;font-weight:700;color:#3a5a3a;">Action Required: Add to Tuesday Class</p>
                        <ol style="margin:0;padding-left:20px;color:#4a4a4a;font-size:14px;line-height:1.9;">
                          <li>Open your <strong>Google Calendar</strong> and find the recurring Tuesday FPU class event.</li>
                          <li>Click the event and select <strong>Edit this and following events</strong>.</li>
                          <li>In the <strong>Guests</strong> field, add: <strong>${clientEmail}</strong></li>
                          <li>Save â€” Google Calendar will send them the invite automatically.</li>
                        </ol>
                      </div>
                      <p style="color:#4a4a4a;font-size:14px;">A welcome email has already been sent to ${clientEmail} with class details.</p>
                      <hr style="border:none;border-top:1px solid #e8e0d8;margin:28px 0;" />
                      <p style="color:#8a9a8a;font-size:13px;text-align:center;">Mind &amp; Body Reset &middot; <a href="https://mindandbodyresetcoach.com" style="color:#c9a96e;">mindandbodyresetcoach.com</a></p>
                    </div>
                  </div>
                `;
                const fpuGroupText = `New FPU Group Enrollment!\n\nName: ${clientName}\nEmail: ${clientEmail}\n\nAction Required: Add ${clientEmail} to your recurring Tuesday FPU Google Calendar event (Edit this and following events, then add their email to Guests and save).\n\nA welcome email has been sent to the client.`;
                await sendOwnerEmail({
                  subject: `New FPU Student: ${clientName} â€” Add to Tuesday Class`,
                  htmlBody: fpuGroupHtml,
                  textBody: fpuGroupText,
                });
              }
            } else if (session.metadata?.plan === "balance") {
              // RECLAIM balance payment (remaining $397)
              const userId = session.metadata?.user_id ? parseInt(session.metadata.user_id) : null;
              const enrollmentId = session.metadata?.enrollment_id ? parseInt(session.metadata.enrollment_id) : null;
              if (userId && enrollmentId) {
                await db
                  .update(enrollments)
                  .set({
                    balancePaid: true,
                    status: "active",
                  })
                  .where(eq(enrollments.id, enrollmentId));
                console.log(`[Stripe] Balance paid for enrollment ${enrollmentId}`);
                
                // Fire Meta Conversions API Purchase event for balance payment
                const balanceEmail = session.customer_details?.email ?? session.metadata?.customer_email ?? null;
                const balanceName = session.customer_details?.name ?? session.metadata?.customer_name ?? null;
                const amount = session.amount_total ?? 39700; // $397 balance
                if (amount > 0) {
                  await firePurchaseFromSession(session, {
                    value: amount,
                    currency: session.currency?.toUpperCase() ?? "USD",
                    content_name: "R.E.C.L.A.I.M. Program - Balance Payment",
                    content_category: "Coaching Program",
                    customerEmail: balanceEmail,
                    customerName: balanceName,
                  });
                }
                await notifyOwner({
                  title: "RECLAIM Balance Payment Received!",
                  content: `Client (user ID: ${userId}) has paid the $397 balance for their R.E.C.L.A.I.M. program.`,
                });
                // Also send email to coach@
                await sendOwnerEmail({
                  subject: "RECLAIM Balance Payment Received â€” $397",
                  htmlBody: `
                    <div style="font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
                      <div style="background:#c9a96e;padding:28px 40px;text-align:center;">
                        <h1 style="margin:0;color:white;font-size:22px;font-weight:700;">RECLAIM Balance Paid! ðŸŽ‰</h1>
                      </div>
                      <div style="padding:32px 40px;">
                        <p style="color:#4a4a4a;font-size:16px;">Hi Lee Anne! A client has paid their $397 RECLAIM balance.</p>
                        <div style="background:#f9f5f0;border-left:4px solid #c9a96e;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0;">
                          <p style="margin:0;font-size:16px;color:#4a4a4a;"><strong>User ID:</strong> ${userId}</p>
                          <p style="margin:8px 0 0;font-size:14px;color:#6a6a6a;">Enrollment ID: ${enrollmentId} â€” Balance: $397 paid in full</p>
                        </div>
                        <hr style="border:none;border-top:1px solid #e8e0d8;margin:28px 0;" />
                        <p style="color:#8a9a8a;font-size:13px;text-align:center;">Mind &amp; Body Reset â€” mindandbodyresetcoach.com</p>
                      </div>
                    </div>
                  `,
                  textBody: `RECLAIM Balance Paid!\n\nUser ID: ${userId}\nEnrollment ID: ${enrollmentId}\nAmount: $397 balance paid in full.`,
                });
              }
            } else {
              // R.E.C.L.A.I.M. deposit or full payment
              const clientName = session.customer_details?.name ?? session.metadata?.customer_name ?? "Unknown";
              const clientEmail = (session.customer_details?.email ?? session.metadata?.customer_email ?? "").toLowerCase().trim();
              const plan = session.metadata?.plan ?? "deposit";
              const paymentIntentId = session.payment_intent as string ?? null;
              
              // Fire Meta Conversions API Purchase event
              const reclaimAmount = session.amount_total ?? (plan === "full" ? 59700 : 20000); // $597 full or $200 deposit
              if (reclaimAmount > 0) {
                await firePurchaseFromSession(session, {
                  value: reclaimAmount,
                  currency: session.currency?.toUpperCase() ?? "USD",
                  content_name: plan === "full" ? "R.E.C.L.A.I.M. Program - Full Payment" : "R.E.C.L.A.I.M. Program - Deposit",
                  content_category: "Coaching Program",
                  customerEmail: clientEmail || null,
                  customerName: clientName !== "Unknown" ? clientName : null,
                });
              }

              // 1. Update the deposit record
              await db
                .update(deposits)
                .set({
                  status: "paid",
                  stripePaymentIntentId: paymentIntentId,
                  clientName,
                  clientEmail,
                })
                .where(eq(deposits.stripeSessionId, session.id));

              // 2. Look up user by email to link enrollment
              let userId: number | null = null;
              if (clientEmail) {
                const userRows = await db
                  .select({ id: users.id })
                  .from(users)
                  .where(eq(users.email, clientEmail))
                  .limit(1);
                if (userRows[0]) {
                  userId = userRows[0].id;
                }
              }
              // Also check metadata for user_id (set when logged-in user checks out)
              if (!userId && session.metadata?.user_id) {
                userId = parseInt(session.metadata.user_id);
              }

              // 3. Create enrollment record (if we have a userId)
              if (userId) {
                // Check if enrollment already exists for this user
                const existingEnrollment = await db
                  .select({ id: enrollments.id })
                  .from(enrollments)
                  .where(eq(enrollments.userId, userId))
                  .limit(1);

                if (!existingEnrollment[0]) {
                  const isFullPayment = plan === "full";
                  const [newEnrollment] = await db
                    .insert(enrollments)
                    .values({
                      userId,
                      stripePaymentIntentId: paymentIntentId,
                      paymentType: isFullPayment ? "full" : "deposit",
                      depositPaid: true,
                      balancePaid: isFullPayment,
                      status: "active",
                    })
                    .$returningId();

                  if (newEnrollment) {
                    // Create 6 coaching session records
                    const sessionValues = RECLAIM_SESSION_LABELS.map((_, idx) => ({
                      enrollmentId: newEnrollment.id,
                      userId,
                      sessionNumber: idx + 1,
                      status: "not_scheduled" as const,
                    }));
                    await db.insert(coachingSessions).values(sessionValues);
                    console.log(`[Stripe] Created enrollment ${newEnrollment.id} + 6 coaching sessions for user ${userId} (${clientEmail})`);
                    
                    // Enroll in drip sequence
                    await enrollUserInSequence(clientEmail, clientName, "reclaim_6_week");
                  }
                } else {
                  // Enrollment exists â€” update payment status
                  await db
                    .update(enrollments)
                    .set({
                      depositPaid: true,
                      balancePaid: plan === "full",
                      status: "active",
                      stripePaymentIntentId: paymentIntentId,
                    })
                    .where(eq(enrollments.userId, userId));
                  console.log(`[Stripe] Updated existing enrollment for user ${userId}`);
                }
              } else {
                // No user account yet â€” enrollment will be created when they sign up
                // The deposit record is saved with their email so it can be linked later
                console.log(`[Stripe] Deposit paid by ${clientEmail} â€” no user account yet. Enrollment pending account creation.`);
              }

              // Send welcome email to client
              await sendReclaimWelcomeEmail({
                clientEmail,
                clientName,
                isPaidInFull: plan === "full",
              });
              await notifyOwner({
                title: plan === "full" ? "New RECLAIM Full Payment Received! ðŸŽ‰" : "New $200 RECLAIM Deposit Received!",
                content: `Client: ${clientName} (${clientEmail}) has ${plan === "full" ? "paid in full ($597)" : "paid the $200 deposit"}. ${userId ? "Enrollment created automatically." : "No account yet â€” enrollment pending sign-up."}`,
              });
              // Also send email to coach@
              await sendOwnerEmail({
                subject: plan === "full" ? `New RECLAIM Client (Full Payment): ${clientName}` : `New RECLAIM Deposit: ${clientName} â€” $200`,
                htmlBody: `
                  <div style="font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
                    <div style="background:#c9a96e;padding:28px 40px;text-align:center;">
                      <h1 style="margin:0;color:white;font-size:22px;font-weight:700;">${plan === "full" ? "New RECLAIM Full Payment! ðŸŽ‰" : "New RECLAIM Deposit Received!"}</h1>
                    </div>
                    <div style="padding:32px 40px;">
                      <p style="color:#4a4a4a;font-size:16px;">Hi Lee Anne! You have a new R.E.C.L.A.I.M. client:</p>
                      <div style="background:#f9f5f0;border-left:4px solid #c9a96e;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0;">
                        <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#3a5a3a;">${clientName}</p>
                        <p style="margin:0;font-size:16px;color:#4a4a4a;"><strong>Email:</strong> <a href="mailto:${clientEmail}" style="color:#c9a96e;">${clientEmail}</a></p>
                        <p style="margin:8px 0 0;font-size:14px;color:#6a6a6a;">${plan === "full" ? "Paid in full: $597" : "Deposit paid: $200 (balance $397 remaining)"}</p>
                        <p style="margin:8px 0 0;font-size:14px;color:#6a6a6a;">${userId ? "âœ… Enrollment created automatically" : "â³ No account yet â€” enrollment pending sign-up"}</p>
                      </div>
                      <hr style="border:none;border-top:1px solid #e8e0d8;margin:28px 0;" />
                      <p style="color:#8a9a8a;font-size:13px;text-align:center;">Mind &amp; Body Reset â€” mindandbodyresetcoach.com</p>
                    </div>
                  </div>
                `,
                textBody: `New RECLAIM Client!\n\nName: ${clientName}\nEmail: ${clientEmail}\nPayment: ${plan === "full" ? "Full $597" : "$200 deposit (balance $397 remaining)"}\n${userId ? "Enrollment created automatically." : "No account yet â€” enrollment pending sign-up."}`,
              });
            }
          } catch (dbErr) {
            console.error("[Stripe Webhook] DB update failed:", dbErr);
          }
        }
      }

      if (event.type === "checkout.session.expired") {
        const session = event.data.object as Stripe.Checkout.Session;
        const db = await getDb();
        if (db && session.id) {
          const product = session.metadata?.product;
          if (product === "fpu" || product === "fpu_coaching") {
            await db
              .update(fpuOrders)
              .set({ status: "failed" })
              .where(eq(fpuOrders.stripeSessionId, session.id));
          } else {
            await db
              .update(deposits)
              .set({ status: "failed" })
              .where(eq(deposits.stripeSessionId, session.id));
          }
        }
      }

      return NextResponse.json({ received: true });
}

