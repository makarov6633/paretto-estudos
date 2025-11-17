import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { subscription } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { isEventProcessed, markEventProcessed } from "@/lib/stripe-webhook";
import { logger } from "@/lib/logger";

function getPeriodEnd(sub: Stripe.Subscription): Date | null {
  const s = sub as unknown as {
    current_period_end?: number;
    currentPeriodEnd?: number;
  };
  const t =
    typeof s.currentPeriodEnd === "number"
      ? s.currentPeriodEnd
      : s.current_period_end;
  return typeof t === "number" ? new Date(t * 1000) : null;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!sig || !secret) {
    logger.warn({ sig: !!sig, secret: !!secret }, 'Missing Stripe signature or secret');
    return NextResponse.json({ error: 'missing signature or secret' }, { status: 400 });
  }
  const stripe = getStripe();
  const raw = await req.text();
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
    logger.info({ eventId: event.id, eventType: event.type }, 'Stripe webhook received');
  } catch (err) {
    logger.error({ err }, 'Invalid Stripe webhook signature');
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }
  
  // Idempotency check: skip if already processed
  if (await isEventProcessed(event.id)) {
    logger.info({ eventId: event.id }, 'Webhook event already processed (idempotent)');
    return NextResponse.json({ received: true, idempotent: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId as string | undefined;
      const subId = session.subscription as string | undefined;
      
      if (!userId) {
        logger.warn({ eventId: event.id, sessionId: session.id }, 'checkout.session.completed without userId');
        // Skip this event if no userId
      } else {
      
      let status = "active";
      let currentPeriodEnd: Date | null = null;
      
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId) as Stripe.Subscription;
        status = sub.status as string;
        currentPeriodEnd = getPeriodEnd(sub);
      }
        logger.info({ userId, subId, status }, 'Creating/updating subscription from checkout');
        await db
          .insert(subscription)
          .values({
            id: crypto.randomUUID(),
            userId,
            status,
            currentPeriodEnd,
            stripeCustomerId:
              (session.customer as string | undefined) ?? undefined,
            stripeSubscriptionId: subId,
          })
          .onConflictDoUpdate({
            target: subscription.userId,
            set: {
              status,
              currentPeriodEnd,
              stripeCustomerId:
                (session.customer as string | undefined) ?? undefined,
              stripeSubscriptionId: subId,
              updatedAt: new Date(),
            },
          });
      }
    } else if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      const subId = sub.id as string | undefined;
      const status = sub.status as string;
      const currentPeriodEnd = getPeriodEnd(sub);
      // We don't have userId in this payload; try to find by subscription id
      try {
        await db
          .update(subscription)
          .set({ status, currentPeriodEnd, updatedAt: new Date() })
          .where(eq(subscription.stripeSubscriptionId, subId as string));
      } catch {}
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const subId = sub.id as string | undefined;
      try {
        await db
          .update(subscription)
          .set({
            status: "canceled",
            currentPeriodEnd: getPeriodEnd(sub),
            updatedAt: new Date(),
          })
          .where(eq(subscription.stripeSubscriptionId, subId as string));
      } catch {}
    }
    
    // Mark as processed after successful handling
    await markEventProcessed(event.id, event.type, event.data.object);
    
  } catch (err) {
    logger.error({ err, eventId: event.id, eventType: event.type }, 'Stripe webhook processing error');
    
    // Still return 200 to Stripe to prevent infinite retries
    // Monitoring/alerting should catch these errors
    return NextResponse.json(
      { received: true, error: "Processing error logged" },
      { status: 200 }
    );
  }

  logger.info({ eventId: event.id, eventType: event.type }, 'Stripe webhook processed successfully');
  return NextResponse.json({ received: true });
}


