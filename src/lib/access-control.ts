import { db } from "@/lib/db";
import { readingEvent, subscription } from "@/lib/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { logAudit } from "@/lib/audit-log";

export type AccessResult = {
  allowed: boolean;
  reason: 'premium' | 'free' | 'limit' | 'unauthorized';
  remainingFree?: number;
};

/**
 * Check if user has access to content
 * Centralized access control logic
 */
export async function checkUserAccess(userId: string | null, itemId?: string): Promise<AccessResult> {
  if (!userId) {
    await logAudit(null, 'access.denied', { reason: 'unauthorized' });
    return { allowed: false, reason: 'unauthorized' };
  }

  // Check premium subscription
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
      sub.status === 'active' &&
      (!sub.currentPeriodEnd || sub.currentPeriodEnd > now)
    ) {
      await logAudit(userId, 'access.granted', { reason: 'premium', itemId });
      return { allowed: true, reason: 'premium' };
    }
  } catch {
    // If subscription check fails, fall through to free tier
  }

  // Free tier: 5 items per calendar month
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
    const remaining = Math.max(0, 5 - used);

    if (used >= 5) {
      await logAudit(userId, 'access.denied', { reason: 'limit', used, itemId });
      return { allowed: false, reason: 'limit', remainingFree: 0 };
    }

    await logAudit(userId, 'access.granted', { reason: 'free', remaining, itemId });
    return { allowed: true, reason: 'free', remainingFree: remaining };
  } catch {
    // If counting fails, be permissive but log the error
    console.error('Failed to check free tier usage');
    return { allowed: true, reason: 'free' };
  }
}

/**
 * Extract user ID from session
 */
export async function getUserIdFromRequest(req: Request): Promise<string | null> {
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

    const json: { user?: { id?: string }; id?: string } | null = await res.json().catch(() => null);
    const id = json?.user?.id || json?.id || null;
    return typeof id === "string" ? id : null;
  } catch {
    return null;
  }
}
