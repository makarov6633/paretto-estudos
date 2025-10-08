"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { subscription } from "@/lib/schema";
import { eq } from "drizzle-orm";

type SessionPayload = {
  user?: { id?: string; email?: string };
  id?: string;
} | null;

let sessionMemo: { cookie: string | null; payload: SessionPayload; exp: number } = {
  cookie: null,
  payload: null,
  exp: 0,
};

async function getUserFromSession(): Promise<{
  id: string;
  email?: string;
} | null> {
  try {
    const hdrs = await headers();
    const origin =
      process.env.NEXT_PUBLIC_BASE_URL ||
      `${hdrs.get("x-forwarded-proto") ?? "http"}://${hdrs.get("x-forwarded-host") ?? hdrs.get("host")}`;
    const cookie = hdrs.get("cookie") || "";
    const now = Date.now();
    if (sessionMemo.cookie === cookie && sessionMemo.exp > now) {
      const data = sessionMemo.payload;
      const id = data?.user?.id || data?.id;
      if (id && typeof id === "string") {
        const email = data?.user?.email || undefined;
        return { id, email };
      }
      return null;
    }
    const res = await fetch(`${origin}/api/auth/get-session`, {
      method: "GET",
      headers: { Accept: "application/json", Cookie: cookie },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as SessionPayload;
    sessionMemo = { cookie, payload: data, exp: now + 5000 };
    const id = data?.user?.id || data?.id;
    if (!id || typeof id !== "string") return null;
    const email = data?.user?.email || undefined;
    return { id, email };
  } catch {
    return null;
  }
}

export async function createCheckoutSession() {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/plans?signin=1");
  }
  const stripe = getStripe();
  const hdrs = await headers();
  const origin =
    process.env.NEXT_PUBLIC_BASE_URL ||
    `${hdrs.get("x-forwarded-proto") ?? "http"}://${hdrs.get("x-forwarded-host") ?? hdrs.get("host")}`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: { name: "Plano Mensal - Paretto" },
          unit_amount: 1500, // R$ 15,00
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/plans?success=1`,
    cancel_url: `${origin}/plans?canceled=1`,
    customer_email: user?.email,
    metadata: { userId: user.id },
  }, { idempotencyKey: `chk_${Date.now()}_${Math.random().toString(36).slice(2)}` });

  if (session.url) redirect(session.url);
  redirect("/plans");
}

export async function openBillingPortal() {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/plans?signin=1");
  }
  const stripe = getStripe();
  const hdrs = await headers();
  const origin =
    process.env.NEXT_PUBLIC_BASE_URL ||
    `${hdrs.get("x-forwarded-proto") ?? "http"}://${hdrs.get("x-forwarded-host") ?? hdrs.get("host")}`;
  try {
    const rows = await db
      .select({ customerId: subscription.stripeCustomerId })
      .from(subscription)
      .where(eq(subscription.userId, user.id))
      .limit(1);
    const customerId = rows[0]?.customerId || undefined;
    if (!customerId) {
      redirect("/plans?portal=not_found");
    }
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId as string,
      return_url: `${origin}/plans`,
    });
    if (portal.url) redirect(portal.url);
  } catch {
    // swallow details to avoid leaking
  }
  redirect("/plans?portal=error");
}

