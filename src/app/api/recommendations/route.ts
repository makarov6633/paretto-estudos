import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { item, userPreference } from "@/lib/schema";
import {
  applyManualCorrections,
  filterManualDuplicates,
} from "@/lib/manual-fixes";
import { desc, eq, sql } from "drizzle-orm";
import { computeEtag } from "@/lib/http";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
// Keep types inferred from DB; avoid forcing Item shape here

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestedUserId = searchParams.get("userId") || undefined;
  const limit = Number(searchParams.get("limit") ?? 12);

  // Validate user authorization if userId is requested
  let userId: string | undefined = requestedUserId;
  if (requestedUserId) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (requestedUserId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: Cannot access other user preferences' }, { status: 403 });
    }
    userId = session.user.id;
  }

  try {
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
    let tags: string[] = [];
    if (userId) {
      const prefs = await db
        .select()
        .from(userPreference)
        .where(eq(userPreference.userId, userId))
        .orderBy(desc(userPreference.weight))
        .limit(3);
      tags = prefs
        .map((p: typeof userPreference.$inferSelect) => p.tag)
        .filter(Boolean) as string[];
    }

    if (tags.length === 0) {
      const rows = await db
        .select({
          id: item.id,
          slug: item.slug,
          title: item.title,
          author: item.author,
          coverImageUrl: item.coverImageUrl,
          hasPdf: item.hasPdf,
          readingMinutes: item.readingMinutes,
        })
        .from(item)
        .orderBy(desc(item.createdAt))
        .limit(limit);
      const proj = filterManualDuplicates(
        applyManualCorrections(
          rows as {
            id: string;
            slug: string;
            title: string;
            author: string;
            coverImageUrl: string | null;
            hasPdf: boolean;
            readingMinutes: number | null;
          }[],
        ),
      );
      return withConditionalETag(
        { items: proj },
        "public, s-maxage=300, stale-while-revalidate=60",
      );
    }

    const rows = await db
      .select({
        id: item.id,
        slug: item.slug,
        title: item.title,
        author: item.author,
        coverImageUrl: item.coverImageUrl,
        hasPdf: item.hasPdf,
        readingMinutes: item.readingMinutes,
        tags: item.tags,
        matchScore: sql<number>`
          (SELECT COUNT(*) FROM jsonb_array_elements_text(${item.tags}) AS tag 
           WHERE tag IN (${sql.join(tags.map(t => sql`${t}`), sql`, `)}))
        `,
      })
      .from(item)
      .where(
        sql`EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(${item.tags}) AS tag 
          WHERE tag IN (${sql.join(tags.map(t => sql`${t}`), sql`, `)})
        )`
      )
      .orderBy(
        desc(sql`(SELECT COUNT(*) FROM jsonb_array_elements_text(${item.tags}) AS tag WHERE tag IN (${sql.join(tags.map(t => sql`${t}`), sql`, `)}))`),
        desc(item.createdAt)
      )
      .limit(limit);
    const proj = filterManualDuplicates(
      applyManualCorrections(
        rows as {
          id: string;
          slug: string;
          title: string;
          author: string;
          coverImageUrl: string | null;
          hasPdf: boolean;
          readingMinutes: number | null;
        }[],
      ),
    );
    return withConditionalETag(
      { items: proj },
      "public, s-maxage=300, stale-while-revalidate=60",
    );
  } catch (e) {
    console.error("GET /api/recommendations error", e);
    const body = { items: [] };
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
