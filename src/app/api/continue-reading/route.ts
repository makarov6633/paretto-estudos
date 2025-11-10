import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readingProgress, item } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "6", 10);

    const continueReadingItems = await db
      .select({
        id: item.id,
        slug: item.slug,
        title: item.title,
        author: item.author,
        coverImageUrl: item.coverImageUrl,
        readingMinutes: item.readingMinutes,
        tags: item.tags,
        scrollProgress: readingProgress.scrollProgress,
        currentSectionIndex: readingProgress.currentSectionIndex,
        lastReadAt: readingProgress.lastReadAt,
      })
      .from(readingProgress)
      .innerJoin(item, eq(readingProgress.itemId, item.id))
      .where(eq(readingProgress.userId, session.user.id))
      .orderBy(desc(readingProgress.lastReadAt))
      .limit(limit);

    return NextResponse.json({ items: continueReadingItems });
  } catch (error) {
    console.error("Error fetching continue reading items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}
