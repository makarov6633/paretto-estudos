import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscription, readingEvent } from "@/lib/schema";
import { and, eq, gte, sql } from "drizzle-orm";

type SessionPayload = { user?: { id?: string }; id?: string } | null;

let sessionMemo: { cookie: string | null; id: string | null; exp: number } = {
  cookie: null,
  id: null,
  exp: 0,
};

async function getUserId(req: Request): Promise<string | null> {
  try {
    const origin = new URL(req.url).origin;
    const cookie = req.headers.get("cookie") || "";
    const now = Date.now();
    if (sessionMemo.cookie === cookie && sessionMemo.exp > now) {
      return sessionMemo.id;
    }
    const res = await fetch(`${origin}/api/auth/get-session`, {
      method: "GET",
      headers: { Cookie: cookie, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data: SessionPayload = await res.json().catch(() => null);
    const id = data?.user?.id || data?.id || null;
    sessionMemo = { cookie, id, exp: now + 5000 };
    return typeof id === "string" ? id : null;
  } catch {
    return null;
  }
}

// simple per-user memo cache
const memo = new Map<string, { body: unknown; exp: number }>();
const TTL = 60_000; // 60s

export async function GET(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ plan: "guest" }, { status: 200 });
  const now = Date.now();
  const hit = memo.get(userId);
  if (hit && hit.exp > now) {
    return NextResponse.json(hit.body, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60" },
    });
  }
  let plan: "premium" | "free" = "free";
  let currentPeriodEnd: Date | null = null;
  try {
    const rows = await db
      .select({
        status: subscription.status,
        cpe: subscription.currentPeriodEnd,
      })
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .limit(1);
    const s = rows[0];
    const now = new Date();
    if (s && s.status === "active" && (!s.cpe || s.cpe > now)) {
      plan = "premium";
      currentPeriodEnd = s.cpe || null;
    }
  } catch {}

  let usage = 0;
  const limit = 5;
  try {
    const first = new Date();
    first.setDate(1);
    first.setHours(0, 0, 0, 0);
    const out = await db
      .select({ count: sql<number>`count(distinct ${readingEvent.itemId})` })
      .from(readingEvent)
      .where(
        and(
          eq(readingEvent.userId, userId),
          gte(readingEvent.createdAt, first),
        ),
      )
      .limit(1);
    usage = Number(out[0]?.count || 0);
  } catch {}

  const body = { plan, currentPeriodEnd, usage, limit };
  memo.set(userId, { body, exp: now + TTL });
  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60" },
  });
}

