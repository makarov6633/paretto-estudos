import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readingEvent, subscription } from "@/lib/schema";
import { and, eq, gte, sql } from "drizzle-orm";

type SessionPayload = { user?: { id?: string }; id?: string } | null;

async function getUserIdFromSession(req: Request): Promise<string | null> {
  try {
    const origin = new URL(req.url).origin;
    const res = await fetch(`${origin}/api/auth/get-session`, {
      method: "GET",
      headers: {
        Cookie: req.headers.get("cookie") || "",
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json: SessionPayload = await res.json().catch(() => null);
    const id = json?.user?.id || json?.id || null;
    return typeof id === "string" ? id : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  // const itemId = new URL(req.url).searchParams.get('itemId') || undefined; // reserved for future enforcement per item
  const userId = await getUserIdFromSession(req);
  if (!userId)
    return NextResponse.json(
      { allowed: false, reason: "unauthorized" },
      { status: 401 },
    );

  // Premium check via DB (best-effort)
  try {
    const now = new Date();
    const subs = await db
      .select({
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      })
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .limit(1);
    const sub = subs[0];
    if (
      sub &&
      sub.status === "active" &&
      (!sub.currentPeriodEnd || sub.currentPeriodEnd > now)
    ) {
      return NextResponse.json({ allowed: true, reason: "premium" });
    }
  } catch {
    // If table doesn't exist, fall through to free-limited logic
  }

  // Free tier: 5 opens per calendar month
  const firstDay = new Date();
  firstDay.setDate(1);
  firstDay.setHours(0, 0, 0, 0);
  try {
    const rows = await db
      .select({ count: sql<number>`count(distinct ${readingEvent.itemId})` })
      .from(readingEvent)
      .where(
        and(
          eq(readingEvent.userId, userId),
          gte(readingEvent.createdAt, firstDay),
        ),
      )
      .limit(1);
    const used = Number(rows[0]?.count || 0);
    if (used >= 5) {
      return NextResponse.json(
        { allowed: false, reason: "limit" },
        { status: 402 },
      );
    }
  } catch {
    // If counting fails, be safe but permissive
  }

  return NextResponse.json({ allowed: true, reason: "free" });
}
