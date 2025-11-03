import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { item, readingEvent } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { telemetrySchema } from "@/schemas";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { verifyCsrf } from "@/lib/security";
// (no unused types required here)

export async function POST(req: Request) {
  // CSRF protection
  if (!verifyCsrf(req)) {
    return NextResponse.json({ ok: false, error: "CSRF validation failed" }, { status: 403 });
  }

  // Authentication check
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
  }

  try {
    const len = Number(req.headers.get("content-length") || 0);
    if (len && len > 64 * 1024) {
      return NextResponse.json(
        { ok: false, error: "payload too large" },
        { status: 413 },
      );
    }
    const json = await req.json().catch(() => ({}));
    const schema = telemetrySchema.extend({ itemId: z.string().min(1) });
    const parsed = schema.safeParse(json);
    if (!parsed.success)
      return NextResponse.json(
        { ok: false, error: "Invalid payload" },
        { status: 400 },
      );
    const {
      userId: requestedUserId,
      name: event,
      itemId,
    } = parsed.data as { userId?: string; name: string; itemId: string };
    
    // Validate userId matches session
    if (requestedUserId && requestedUserId !== session.user.id) {
      return NextResponse.json(
        { ok: false, error: "Forbidden: Cannot log events for other users" },
        { status: 403 },
      );
    }
    
    const userId = session.user.id;
    if (!itemId || !event) {
      return NextResponse.json(
        { ok: false, error: "missing fields" },
        { status: 400 },
      );
    }

    await db
      .insert(readingEvent)
      .values({ id: crypto.randomUUID(), userId, itemId, event });

    // Fetch tags for item and upsert preferences
    const rows = await db
      .select()
      .from(item)
      .where(eq(item.id, itemId))
      .limit(1);
    const tags: string[] = Array.isArray(rows[0]?.tags as unknown as string[])
      ? (rows[0]?.tags as unknown as string[])
      : [];
    if (tags.length) {
      const weight = event === "finish" ? 3 : event === "play" ? 2 : 1;
      for (const tag of tags) {
        await db.execute(sql`
          insert into "user_preference" (id, "userId", tag, weight, "updatedAt")
          values (${crypto.randomUUID()}, ${userId}, ${tag}, ${weight}, now())
          on conflict ("userId", tag)
          do update set weight = "user_preference".weight + ${weight}, "updatedAt" = now()
        `);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/telemetry error", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
