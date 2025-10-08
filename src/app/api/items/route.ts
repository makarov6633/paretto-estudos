import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { item, audioTrack, summarySection, syncMap } from "@/lib/schema";
import {
} from "@/lib/manual-fixes";
import {
  and,
  eq,
  ilike,
  inArray,
  desc,
  asc,
  type SQLWrapper,
} from "drizzle-orm";
import { computeEtag } from "@/lib/http";

// Pequena correção baseada em padrão para títulos específicos
function fixTitle(title: string): string {
  try {
    const t = String(title || "").trim();
    const low = t.toLowerCase();
    // Pedido: "Handbook of Psychology: Personalidade e Psicologia Social" -> "Personalidade e psicologia social"
    if (
      low.includes("handbook of psychology") &&
      low.includes("personalidade e psicologia social")
    ) {
      return "Personalidade e psicologia social";
    }
    return t;
  } catch {
    return title;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const slug = searchParams.get("slug")?.trim();
    const hasAudio = searchParams.get("hasAudio");
    const hasPdf = searchParams.get("hasPdf");
    const tag = searchParams.get("tag");
    const limit = Number(searchParams.get("limit") ?? 24);
    const page = Number(searchParams.get("page") ?? 1);
    const offset = (page - 1) * limit;
    const expand = searchParams.get("expand");
    const withSync = searchParams.get("withSync") === "1";
    const sort = searchParams.get("sort");

    // ETag helper for conditional responses
    const withConditionalETag = (data: unknown, cacheCtl: string) => {
      const etag = computeEtag(data);
      const inm = req.headers.get("if-none-match");
      if (inm && inm === etag) {
        return new Response(null, {
          status: 304,
          headers: { ETag: etag, "Cache-Control": cacheCtl },
        });
      }
      return NextResponse.json(data, {
        headers: { ETag: etag, "Cache-Control": cacheCtl },
      });
    };

    const whereClauses: SQLWrapper[] = [];
    if (slug) {
      const rows = await db
        .select()
        .from(item)
        .where(eq(item.slug, slug))
        .limit(1);
      if (!rows.length)
        return withConditionalETag(
          { items: [], page: 1, limit: 0 },
          "public, s-maxage=180, stale-while-revalidate=60",
        );
      // Aplique correções manuais (titulo/capa/autor) por slug
      const correctedRows = rows;
      if (expand === "tracks") {
        const tracks = await db
          .select()
          .from(audioTrack)
          .where(
            inArray(
              audioTrack.itemId,
              rows.map((r) => r.id),
            ),
          );
        const withTracks = correctedRows.map((r) => ({
          ...r,
          title: fixTitle(r.title),
          audioTracks: tracks.filter(
            (t) => t.itemId === r.id,
          ),
        }));
        return withConditionalETag(
          { items: withTracks, page: 1, limit: 1 },
          "public, s-maxage=180, stale-while-revalidate=60",
        );
      }
      if (expand === "full") {
        const [tracks, sections, sync] = await Promise.all([
          db.select().from(audioTrack).where(eq(audioTrack.itemId, rows[0].id)),
          db
            .select()
            .from(summarySection)
            .where(eq(summarySection.itemId, rows[0].id))
            .orderBy(summarySection.orderIndex),
          db
            .select()
            .from(syncMap)
            .where(eq(syncMap.itemId, rows[0].id))
            .limit(1),
        ]);
        const enriched = {
          ...correctedRows[0],
          title: fixTitle(correctedRows[0].title),
          audioTracks: tracks,
          sections,
          syncMap: sync[0] ?? null,
        };
        return withConditionalETag(
          { items: [enriched], page: 1, limit: 1 },
          "public, s-maxage=180, stale-while-revalidate=60",
        );
      }
      return withConditionalETag(
        {
          items: correctedRows.map((r) => ({
            ...r,
            title: fixTitle(r.title),
          })),
          page: 1,
          limit: 1,
        },
        "public, s-maxage=180, stale-while-revalidate=60",
      );
    }
    if (q) {
      // match on title (and optionally author if schema supports)
      whereClauses.push(ilike(item.title, `%${q}%`));
    }
    if (hasAudio === "1") whereClauses.push(eq(item.hasAudio, true));
    if (hasPdf === "1") whereClauses.push(eq(item.hasPdf, true));
    // Filtro por tag: como tags Ã© jsonb, usamos um fallback simples no tÃ­tulo
    if (tag) whereClauses.push(ilike(item.title, `%${tag}%`));

    const where = whereClauses.length ? and(...whereClauses) : undefined;

    const projection = {
      id: item.id,
      slug: item.slug,
      title: item.title,
      author: item.author,
      coverImageUrl: item.coverImageUrl,
      hasAudio: item.hasAudio,
      hasPdf: item.hasPdf,
      readingMinutes: item.readingMinutes,
      audioMinutes: item.audioMinutes,
      createdAt: item.createdAt,
    } as const;

    const selected = where
      ? db.select(projection).from(item).where(where)
      : db.select(projection).from(item);
    const ordered =
      sort === "new"
        ? selected.orderBy(desc(item.createdAt))
        : sort === "old"
          ? selected.orderBy(asc(item.createdAt))
          : selected;

    type Row = {
      id: string;
      slug: string;
      title: string;
      author: string;
      coverImageUrl: string | null;
      hasAudio: boolean;
      hasPdf: boolean;
      readingMinutes: number | null;
      audioMinutes: number | null;
      createdAt: Date;
    };
    const data: Row[] = await ordered.limit(limit).offset(offset);
    // Normalize + dedupe by title to avoid duplicates leaking to clients
    const norm = (s: unknown) => {
      let t = String(s || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      // Remove marcadores de volume/parte/capitulo comuns
      t = t.replace(
        /\b(livro|volume|vol|capitulo|cap|parte|pt)\b\s*[ivx0-9\.\-]+/g,
        "",
      );
      t = t.replace(/\bv\.?\s*[0-9]+/g, "");
      t = t.replace(/\bpt\.?\s*[0-9]+/g, "");
      // Remover termos de resumo/ruido comuns para normalizacao
      t = t.replace(
        /\b(resumo|completo|final|profissional|padronizado|reestruturado|reorganizado|corrigido|expandido|otimizado)\b/g,
        "",
      );
      return t.replace(/[^a-z0-9]+/g, " ").trim();
    };
    // Apply manual corrections first
    const corrected: Row[] = data.map((r) => ({
      ...r,
      title: fixTitle(r.title),
    }));

    const uniqMap = new Map<string, Row>();
    for (const it of corrected) {
      const key = norm(it.title);
      if (!uniqMap.has(key)) uniqMap.set(key, it);
    }
    const unique = Array.from(uniqMap.values());

    // Optionally annotate sync presence
    type RowWithSync = Row & { hasSync: boolean };
    let out: Row[] | RowWithSync[] = unique;
    if (withSync && unique.length) {
      try {
        const ids = unique.map((u) => u.id);
        const rows = await db
          .select({ itemId: syncMap.itemId })
          .from(syncMap)
          .where(inArray(syncMap.itemId, ids));
        const set = new Set(rows.map((r) => r.itemId));
        out = unique.map((u) => ({ ...u, hasSync: set.has(u.id) }));
      } catch (e) {
        console.warn("withSync annotate failed", e);
      }
    }

    return withConditionalETag(
      { items: out, page, limit },
      "public, s-maxage=180, stale-while-revalidate=60",
    );
  } catch (error) {
    console.error("/api/items failed:", error);
    // Fallback seguro para ambientes sem DB configurado
    const body = { items: [], page: 1, limit: 24 };
    const etag = computeEtag(body);
    const inm = req.headers.get("if-none-match");
    if (inm && inm === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      });
    }
    return NextResponse.json(body, {
      status: 200,
      headers: {
        ETag: etag,
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  }
}
