import { NextResponse } from "next/server";
import { verifyCsrf, sanitizeString } from "@/lib/security";
import { validateBodySize } from "@/lib/http";
import { db } from "@/lib/db";
import { bookRequest } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { PAYLOAD_LIMITS, FIELD_LIMITS, ERROR_MESSAGES } from "@/lib/constants";
import crypto from "node:crypto";

let sessionMemo: { cookie: string | null; id: string | null; exp: number } = {
  cookie: null,
  id: null,
  exp: 0,
};

async function getUserIdFromSession(req: Request): Promise<string | null> {
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
    const json: unknown = await res.json().catch(() => null);
    const data = json as { user?: { id?: string }; id?: string } | null;
    const id = data?.user?.id || data?.id || null;
    sessionMemo = { cookie, id, exp: now + 5000 };
    return typeof id === "string" && id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

const memo = new Map<string, { body: unknown; exp: number }>();
const TTL = 60_000;

export async function GET(req: Request) {
  const userId = await getUserIdFromSession(req);
  if (!userId)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const now = Date.now();
  const hit = memo.get(userId);
  if (hit && hit.exp > now) {
    return NextResponse.json(hit.body, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60" },
    });
  }
  try {
    const rows = await db
      .select()
      .from(bookRequest)
      .where(
        and(eq(bookRequest.userId, userId), eq(bookRequest.status, "pending")),
      )
      .limit(1);
    const body = { request: rows[0] ?? null };
    memo.set(userId, { body, exp: now + TTL });
    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const createSchema = z.object({
  title: z.string().min(3).max(FIELD_LIMITS.TITLE),
  author: z.string().max(FIELD_LIMITS.AUTHOR).optional(),
  sourceUrl: z.string().url().max(FIELD_LIMITS.URL).optional(),
  notes: z.string().max(FIELD_LIMITS.NOTES).optional(),
});

export async function POST(req: Request) {
  // Validação CSRF
  if (!verifyCsrf(req)) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.CSRF_INVALID },
      { status: 403 }
    );
  }
  
  // Validação de autenticação
  const userId = await getUserIdFromSession(req);
  if (!userId) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.UNAUTHORIZED },
      { status: 401 }
    );
  }
  
  // Validação de tamanho
  const sizeError = validateBodySize(req, PAYLOAD_LIMITS.BOOK_REQUEST);
  if (sizeError) return sizeError;
  
  // Parse e validação de dados
  const json = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  try {
    const pending = await db
      .select({ id: bookRequest.id })
      .from(bookRequest)
      .where(
        and(eq(bookRequest.userId, userId), eq(bookRequest.status, "pending")),
      )
      .limit(1);
    if (pending.length) {
      return NextResponse.json({ error: "already_pending" }, { status: 409 });
    }
    const id = crypto.randomUUID();
    await db.insert(bookRequest).values({
      id,
      userId,
      title: sanitizeString(parsed.data.title),
      author: sanitizeString(parsed.data.author),
      sourceUrl: sanitizeString(parsed.data.sourceUrl),
      notes: sanitizeString(parsed.data.notes),
      status: "pending",
    });
    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

