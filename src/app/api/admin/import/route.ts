import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { item, summarySection, audioTrack, syncMap } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const sectionSchema = z.object({
  id: z.string().optional(),
  orderIndex: z.number().int(),
  heading: z.string().optional(),
  contentHtml: z.string().optional(),
});

const trackSchema = z.object({
  id: z.string().optional(),
  voice: z.string().optional(),
  language: z.string().optional(),
  audioUrl: z.string().url(),
  durationMs: z.number().int().optional(),
});

const syncSchema = z.object({
  id: z.string().optional(),
  granularity: z.enum(["line", "word"]).optional(),
  data: z.any().optional(),
});

const itemSchema = z.object({
  id: z.string().optional(),
  slug: z.string(),
  title: z.string(),
  author: z.string(),
  language: z.string().default("pt-BR").optional(),
  coverImageUrl: z.string().url().optional(),
  pdfUrl: z.string().url().optional(),
  hasAudio: z.boolean().optional(),
  hasPdf: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  readingMinutes: z.number().int().optional(),
  audioMinutes: z.number().int().optional(),
  sections: z.array(sectionSchema).optional(),
  audioTracks: z.array(trackSchema).optional(),
  syncMap: syncSchema.optional(),
});

const payloadSchema = z.object({
  items: z.array(itemSchema),
});

export async function POST(req: Request) {
  const adminSecretHeader = req.headers.get("x-admin-secret") ?? "";
  const expected = process.env.ADMIN_IMPORT_SECRET ?? "";
  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_IMPORT_SECRET not configured on server" },
      { status: 500 }
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
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const results: Array<{ slug: string; status: string }> = [];

  await db.transaction(async (tx) => {
    for (const raw of parsed.data.items) {
      const id = raw.id ?? crypto.randomUUID();

      // If an item with this slug exists, delete to replace fully (cascade handles children)
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
        hasAudio: raw.hasAudio ?? false,
        hasPdf: raw.hasPdf ?? Boolean(raw.pdfUrl),
        tags: raw.tags ? (raw.tags as unknown as object) : undefined,
        readingMinutes: raw.readingMinutes,
        audioMinutes: raw.audioMinutes,
      });

      if (raw.sections?.length) {
        await tx.insert(summarySection).values(
          raw.sections.map((s) => ({
            id: s.id ?? crypto.randomUUID(),
            itemId: id,
            orderIndex: s.orderIndex,
            heading: s.heading,
            contentHtml: s.contentHtml,
          }))
        );
      }

      if (raw.audioTracks?.length) {
        await tx.insert(audioTrack).values(
          raw.audioTracks.map((t) => ({
            id: t.id ?? crypto.randomUUID(),
            itemId: id,
            voice: t.voice,
            language: t.language,
            audioUrl: t.audioUrl,
            durationMs: t.durationMs,
          }))
        );
      }

      if (raw.syncMap) {
        await tx.insert(syncMap).values({
          id: raw.syncMap.id ?? crypto.randomUUID(),
          itemId: id,
          granularity: raw.syncMap.granularity,
          data: raw.syncMap.data as unknown as object,
        });
      }

      results.push({ slug: raw.slug, status: "imported" });
    }
  });

  return NextResponse.json({ ok: true, results });
}


