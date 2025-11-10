import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readingEvent, item } from "@/lib/schema";
import { eq, and, ne, sql, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    const limit = parseInt(searchParams.get("limit") || "6", 10);

    if (!itemId) {
      return NextResponse.json(
        { error: "itemId is required" },
        { status: 400 }
      );
    }

    const usersWhoReadThisItem = await db
      .select({ userId: readingEvent.userId })
      .from(readingEvent)
      .where(
        and(
          eq(readingEvent.itemId, itemId),
          eq(readingEvent.event, "open")
        )
      )
      .groupBy(readingEvent.userId);

    const userIds = usersWhoReadThisItem.map((u) => u.userId);

    if (userIds.length === 0) {
      const fallbackItems = await db
        .select({
          id: item.id,
          slug: item.slug,
          title: item.title,
          author: item.author,
          coverImageUrl: item.coverImageUrl,
          readingMinutes: item.readingMinutes,
          tags: item.tags,
        })
        .from(item)
        .where(ne(item.id, itemId))
        .orderBy(desc(item.createdAt))
        .limit(limit);

      return NextResponse.json({ items: fallbackItems });
    }

    const similarItems = await db
      .select({
        id: item.id,
        slug: item.slug,
        title: item.title,
        author: item.author,
        coverImageUrl: item.coverImageUrl,
        readingMinutes: item.readingMinutes,
        tags: item.tags,
        readCount: sql<number>`COUNT(DISTINCT ${readingEvent.userId})`,
      })
      .from(readingEvent)
      .innerJoin(item, eq(readingEvent.itemId, item.id))
      .where(
        and(
          ne(item.id, itemId),
          sql`${readingEvent.userId} IN (${sql.join(userIds.map((id) => sql`${id}`), sql`, `)})`
        )
      )
      .groupBy(
        item.id,
        item.slug,
        item.title,
        item.author,
        item.coverImageUrl,
        item.readingMinutes,
        item.tags
      )
      .orderBy(desc(sql`COUNT(DISTINCT ${readingEvent.userId})`))
      .limit(limit);

    return NextResponse.json({ items: similarItems });
  } catch (error) {
    console.error("Error fetching similar items:", error);
    return NextResponse.json(
      { error: "Failed to fetch similar items" },
      { status: 500 }
    );
  }
}
