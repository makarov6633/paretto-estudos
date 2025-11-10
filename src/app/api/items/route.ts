import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { item, summarySection } from "@/lib/schema";
import {
} from "@/lib/manual-fixes";
import {
  and,
  eq,
  ilike,
  desc,
  asc,
  or,
  gte,
  lte,
  sql,
  type SQLWrapper,
} from "drizzle-orm";
import { computeEtag } from "@/lib/http";
import { getUserIdFromRequest, checkUserAccess } from "@/lib/access-control";
import { validateSearchQuery, validateLimit, validateOffset, isValidSlug } from "@/lib/input-sanitization";

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
    
    // Validar e sanitizar inputs
    const qParam = searchParams.get("q");
    let q: string | undefined;
    if (qParam) {
      const validation = validateSearchQuery(qParam);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
      q = validation.value;
    }
    
    const slugParam = searchParams.get("slug")?.trim();
    let slug: string | undefined;
    if (slugParam) {
      if (!isValidSlug(slugParam)) {
        return NextResponse.json(
          { error: 'Invalid slug format' },
          { status: 400 }
        );
      }
      slug = slugParam;
    }
    
    const hasPdf = searchParams.get("hasPdf");
    const tag = searchParams.get("tag");
    
    const limitValidation = validateLimit(searchParams.get("limit") ?? 1000, 1000);
    const limit = limitValidation.value;
    
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const offset = (page - 1) * limit;
    const expand = searchParams.get("expand");
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
      // For full content expansion with sections, enforce access control
      if (expand === "full") {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        const access = await checkUserAccess(userId);
        if (!access.allowed) {
          return NextResponse.json(
            { error: 'Access denied', reason: access.reason, remainingFree: access.remainingFree },
            { status: access.reason === 'limit' ? 402 : 403 }
          );
        }
      }

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
      if (expand === "full") {
        const sections = await db
          .select()
          .from(summarySection)
          .where(eq(summarySection.itemId, rows[0].id))
          .orderBy(summarySection.orderIndex);
        const enriched = {
          ...correctedRows[0],
          title: fixTitle(correctedRows[0].title),
          sections,
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
      const searchCondition = or(
        ilike(item.title, `%${q}%`),
        ilike(item.author, `%${q}%`)
      );
      if (searchCondition) {
        whereClauses.push(searchCondition);
      }
    }
    if (hasPdf === "1") whereClauses.push(eq(item.hasPdf, true));
    
    if (tag) {
      whereClauses.push(
        sql`${item.tags}::jsonb @> ${JSON.stringify([tag])}::jsonb`
      );
    }
    
    const minMinutes = searchParams.get("minMinutes");
    const maxMinutes = searchParams.get("maxMinutes");
    if (minMinutes) {
      whereClauses.push(gte(item.readingMinutes, parseInt(minMinutes, 10)));
    }
    if (maxMinutes) {
      whereClauses.push(lte(item.readingMinutes, parseInt(maxMinutes, 10)));
    }

    const where = whereClauses.length ? and(...whereClauses) : undefined;

    const projection = {
      id: item.id,
      slug: item.slug,
      title: item.title,
      author: item.author,
      coverImageUrl: item.coverImageUrl,
      hasPdf: item.hasPdf,
      readingMinutes: item.readingMinutes,
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
      hasPdf: boolean;
      readingMinutes: number | null;
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

    return withConditionalETag(
      { items: unique, page, limit },
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
