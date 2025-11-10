import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  studySession,
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
      quizzesCompleted: 0,
      checklistsCompleted: 0,
      notesCreated: 0,
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

    const studyTime = await db
      .select({
        totalMinutes: sql<number>`COALESCE(SUM(${studySession.duration}), 0) / 60`,
      })
      .from(studySession)
      .where(
        and(
          eq(studySession.userId, userId),
          gte(studySession.createdAt, thirtyDaysAgo)
        )
      );

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

    const dailyStudy = await db
      .select({
        date: sql<string>`DATE(${studySession.createdAt})`,
        minutes: sql<number>`SUM(${studySession.duration}) / 60`,
      })
      .from(studySession)
      .where(
        and(
          eq(studySession.userId, userId),
          gte(studySession.createdAt, new Date(last7Days[0]))
        )
      )
      .groupBy(sql`DATE(${studySession.createdAt})`);

    const studyByDay = last7Days.map((date) => {
      const found = dailyStudy.find((d) => d.date === date);
      return {
        date,
        minutes: found ? Math.round(found.minutes) : 0,
      };
    });

    return NextResponse.json({
      gamification,
      recentBadges,
      totalStudyTimeMinutes: Math.round(studyTime[0]?.totalMinutes || 0),
      categoriesRead: categoriesRead.map((c) => ({
        category: c.category,
        count: Number(c.count),
      })),
      studyByDay,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
