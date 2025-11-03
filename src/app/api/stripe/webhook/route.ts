import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { subscription } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
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
    logger.security('Stripe webhook missing signature or secret', {
      hasSignature: !!sig,
      hasSecret: !!secret,
    });
    return NextResponse.json({ error: 'missing signature or secret' }, { status: 400 });
  }

  const stripe = getStripe();
  const raw = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    logger.security('Invalid Stripe webhook signature', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  logger.info(`Processing Stripe webhook: ${event.type}`, {
    eventId: event.id,
    eventType: event.type,
  });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId =
        (session.metadata?.userId as string | undefined) ?? undefined;
      const subId = (session.subscription as string | undefined) ?? undefined;
      let status = "active";
      let currentPeriodEnd: Date | null = null;

      if (subId) {
        const sub = await (stripe.subscriptions.retrieve(
          subId,
        ) as Promise<Stripe.Subscription>);
        status = sub.status as string;
        currentPeriodEnd = getPeriodEnd(sub);
      }

      if (userId) {
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

        logger.paymentSuccess(
          (session.amount_total || 0) / 100,
          session.currency || 'usd',
          {
            userId,
            subscriptionId: subId,
            customerId: session.customer as string | undefined,
          }
        );
      }
    } else if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      const subId = sub.id as string | undefined;
      const status = sub.status as string;
      const currentPeriodEnd = getPeriodEnd(sub);

      try {
        await db
          .update(subscription)
          .set({ status, currentPeriodEnd, updatedAt: new Date() })
          .where(eq(subscription.stripeSubscriptionId, subId as string));

        logger.info('Subscription updated', {
          subscriptionId: subId,
          status,
        });
      } catch (err) {
        logger.error('Failed to update subscription', {
          subscriptionId: subId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
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

        logger.info('Subscription canceled', {
          subscriptionId: subId,
        });
      } catch (err) {
        logger.error('Failed to cancel subscription', {
          subscriptionId: subId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (e) {
    logger.error('Stripe webhook processing error', {
      eventType: event.type,
      eventId: event.id,
      error: e instanceof Error ? e.message : String(e),
    });

    // Still return 200 to Stripe to prevent retries for unrecoverable errors
    return NextResponse.json(
      { received: true, error: "Processing error logged" },
      { status: 200 }
    );
  }

  return NextResponse.json({ received: true });
}
