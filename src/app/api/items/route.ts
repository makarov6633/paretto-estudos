import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { item } from "@/lib/schema";
import { and, eq, ilike } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const hasAudio = searchParams.get("hasAudio");
  const hasPdf = searchParams.get("hasPdf");
  const tag = searchParams.get("tag");
  const limit = Number(searchParams.get("limit") ?? 24);
  const page = Number(searchParams.get("page") ?? 1);
  const offset = (page - 1) * limit;

  const whereClauses = [] as any[];
  if (q) {
    // match on title or author
    whereClauses.push(
      ilike(item.title, `%${q}%`) // drizzle builds OR with 'and' wrappers below
    );
  }
  if (hasAudio === "1") whereClauses.push(eq(item.hasAudio, true));
  if (hasPdf === "1") whereClauses.push(eq(item.hasPdf, true));
  if (tag) whereClauses.push(ilike(item.tags as any, `%${tag}%`));

  const where = whereClauses.length
    ? and(...whereClauses)
    : undefined;

  const data = await db
    .select()
    .from(item)
    .where(where as any)
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ items: data, page, limit });
}


