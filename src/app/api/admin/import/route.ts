import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { item, summarySection } from "@/lib/schema";
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/lib/schema";
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

const sectionSchema = z.object({
  id: z.string().optional(),
  orderIndex: z.number().int(),
  heading: z.string().optional(),
  contentHtml: z.string().optional(),
});

const itemSchema = z.object({
  id: z.string().optional(),
  slug: z.string(),
  title: z.string(),
  author: z.string(),
  language: z.string().default("pt-BR").optional(),
  coverImageUrl: z.string().url().or(z.string().startsWith('/')).optional(),
  pdfUrl: z.string().url().or(z.string().startsWith('/')).optional(),
  hasPdf: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  readingMinutes: z.number().int().optional(),
  sections: z.array(sectionSchema).optional(),
});

const payloadSchema = z.object({
  items: z.array(itemSchema),
});

export async function POST(req: Request) {
  // Enforce payload size limits
  const len = Number(req.headers.get("content-length") || 0);
  if (len && len > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }
  const adminSecretHeader = req.headers.get("x-admin-secret") ?? "";
  const expected = process.env.ADMIN_IMPORT_SECRET ?? "";
  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_IMPORT_SECRET not configured on server" },
      { status: 500 },
    );
  }
  if (adminSecretHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const results: Array<{ slug: string; status: string; error?: string }> = [];

  try {
    await db.transaction(async (tx: PostgresJsDatabase<typeof schema>) => {
      for (const raw of parsed.data.items) {
        const id = raw.id ?? crypto.randomUUID();
        try {
          const existing = await tx
            .select()
            .from(item)
            .where(eq(item.slug, raw.slug));
          if (existing.length > 0) {
            await tx.delete(item).where(eq(item.slug, raw.slug));
          }

          await tx.insert(item).values({
            id,
            slug: raw.slug,
            title: raw.title,
            author: raw.author,
            language: raw.language ?? "pt-BR",
            coverImageUrl: raw.coverImageUrl,
            pdfUrl: raw.pdfUrl,
            hasPdf: raw.hasPdf ?? Boolean(raw.pdfUrl),
            tags: raw.tags ? (raw.tags as unknown as object) : undefined,
            readingMinutes: raw.readingMinutes,
          });

          if (raw.sections?.length) {
            await tx.insert(summarySection).values(
              raw.sections.map((s) => ({
                id: s.id ?? crypto.randomUUID(),
                itemId: id,
                orderIndex: s.orderIndex,
                heading: s.heading,
                contentHtml: s.contentHtml ? DOMPurify.sanitize(s.contentHtml) : undefined,
              })),
            );
          }

          results.push({ slug: raw.slug, status: "imported" });
        } catch (e: unknown) {
          const msg = e instanceof Error ? 'Import failed' : 'Unknown error';
          results.push({ slug: raw.slug, status: "failed", error: msg });
        }
      }
    });
  } catch (e: unknown) {
    console.error("admin/import transaction error", e);
    return NextResponse.json(
      { ok: false, results, error: 'Import transaction failed' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, results });
}
