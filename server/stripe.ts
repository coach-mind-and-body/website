import express, { type Express } from "express";
import Stripe from "stripe";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { deposits } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

function getStripe() {
  return new Stripe(ENV.stripeSecretKey, { apiVersion: "2026-02-25.clover" });
}

export function registerStripeWebhook(app: Express) {
  // MUST use express.raw BEFORE express.json for Stripe signature verification
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"];
      let event: Stripe.Event;

      try {
        const stripe = getStripe();
        event = stripe.webhooks.constructEvent(
          req.body,
          sig as string,
          ENV.stripeWebhookSecret
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[Stripe Webhook] Signature verification failed:", message);
        res.status(400).send(`Webhook Error: ${message}`);
        return;
      }

      // Handle test events — required for webhook verification in test mode
      if (event.id.startsWith("evt_test_")) {
        console.log("[Stripe Webhook] Test event detected, returning verification response");
        res.json({ verified: true });
        return;
      }

      console.log(`[Stripe Webhook] Event: ${event.type} | ID: ${event.id}`);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const db = await getDb();
        if (db && session.id) {
          try {
            await db
              .update(deposits)
              .set({
                status: "paid",
                stripePaymentIntentId: session.payment_intent as string ?? null,
              })
              .where(eq(deposits.stripeSessionId, session.id));

            // Notify the portal owner
            await notifyOwner({
              title: "New $200 Deposit Received!",
              content: `Client: ${session.customer_details?.name ?? session.metadata?.customer_name ?? "Unknown"} (${session.customer_details?.email ?? session.metadata?.customer_email ?? "no email"}) has approved the strategy and paid the $200 deposit.`,
            });
          } catch (dbErr) {
            console.error("[Stripe Webhook] DB update failed:", dbErr);
          }
        }
      }

      if (event.type === "checkout.session.expired") {
        const session = event.data.object as Stripe.Checkout.Session;
        const db = await getDb();
        if (db && session.id) {
          await db
            .update(deposits)
            .set({ status: "failed" })
            .where(eq(deposits.stripeSessionId, session.id));
        }
      }

      res.json({ received: true });
    }
  );
}
