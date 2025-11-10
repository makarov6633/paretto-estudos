import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  userGamification,
  userBadge,
  badgeDefinition,
  readingEvent,
  item,
} from "@/lib/schema";
import { auth } from "@/lib/auth";
import { eq, desc, sql, and, gte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const gamificationData = await db
      .select()
      .from(userGamification)
      .where(eq(userGamification.userId, userId))
      .limit(1);

    const gamification = gamificationData[0] || {
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      level: 1,
      itemsRead: 0,
    };

    const recentBadges = await db
      .select({
        id: badgeDefinition.id,
        name: badgeDefinition.name,
        description: badgeDefinition.description,
        icon: badgeDefinition.icon,
        category: badgeDefinition.category,
        rarity: badgeDefinition.rarity,
        earnedAt: userBadge.earnedAt,
      })
      .from(userBadge)
      .innerJoin(badgeDefinition, eq(userBadge.badgeId, badgeDefinition.id))
      .where(eq(userBadge.userId, userId))
      .orderBy(desc(userBadge.earnedAt))
      .limit(5);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const studyTime = [{ totalMinutes: 0 }];

    const categoriesRead = await db
      .select({
        category: sql<string>`jsonb_array_elements_text(${item.tags})`,
        count: sql<number>`COUNT(DISTINCT ${item.id})`,
      })
      .from(readingEvent)
      .innerJoin(item, eq(readingEvent.itemId, item.id))
      .where(
        and(
          eq(readingEvent.userId, userId),
          eq(readingEvent.event, "open")
        )
      )
      .groupBy(sql`jsonb_array_elements_text(${item.tags})`)
      .orderBy(desc(sql`COUNT(DISTINCT ${item.id})`))
      .limit(5);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split("T")[0];
    }).reverse();

    const studyByDay = last7Days.map((date) => ({
      date,
      minutes: 0,
    }));

    const recommendedItems = await db
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
      .where(
        sql`EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(${item.tags}) AS tag
          WHERE tag IN (
            SELECT up.tag FROM user_preference up 
            WHERE up."userId" = ${userId} 
            ORDER BY up.weight DESC 
            LIMIT 5
          )
        )`
      )
      .orderBy(desc(item.createdAt))
      .limit(4);

    return NextResponse.json({
      gamification,
      recentBadges,
      totalStudyTimeMinutes: 0,
      categoriesRead: categoriesRead.map((c) => ({
        category: c.category,
        count: Number(c.count),
      })),
      studyByDay,
      recommendedItems,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
