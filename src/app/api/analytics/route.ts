import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  readingEvent,
  studySession,
  item,
  readingProgress,
} from "@/lib/schema";
import { auth } from "@/lib/auth";
import { eq, and, gte, sql, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completionRate = await db
      .select({
        started: sql<number>`COUNT(DISTINCT CASE WHEN ${readingEvent.event} = 'open' THEN ${readingEvent.itemId} END)`,
        finished: sql<number>`COUNT(DISTINCT CASE WHEN ${readingEvent.event} = 'finish' THEN ${readingEvent.itemId} END)`,
      })
      .from(readingEvent)
      .where(
        and(
          eq(readingEvent.userId, userId),
          gte(readingEvent.createdAt, thirtyDaysAgo)
        )
      );

    const rate =
      completionRate[0].started > 0
        ? (completionRate[0].finished / completionRate[0].started) * 100
        : 0;

    const averageReadingTime = await db
      .select({
        avgMinutes: sql<number>`AVG(${studySession.duration}) / 60`,
        itemCount: sql<number>`COUNT(DISTINCT ${studySession.itemId})`,
      })
      .from(studySession)
      .where(
        and(
          eq(studySession.userId, userId),
          eq(studySession.type, "reading"),
          gte(studySession.createdAt, thirtyDaysAgo)
        )
      );

    const mostReadSections = await db
      .select({
        itemId: readingProgress.itemId,
        itemTitle: item.title,
        avgProgress: sql<number>`AVG(${readingProgress.scrollProgress})`,
        reads: sql<number>`COUNT(*)`,
      })
      .from(readingProgress)
      .innerJoin(item, eq(readingProgress.itemId, item.id))
      .where(eq(readingProgress.userId, userId))
      .groupBy(readingProgress.itemId, item.title)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(5);

    const abandonmentPoints = await db
      .select({
        progressRange: sql<string>`CASE 
          WHEN ${readingProgress.scrollProgress} < 25 THEN '0-25%'
          WHEN ${readingProgress.scrollProgress} < 50 THEN '25-50%'
          WHEN ${readingProgress.scrollProgress} < 75 THEN '50-75%'
          ELSE '75-100%'
        END`,
        count: sql<number>`COUNT(*)`,
      })
      .from(readingProgress)
      .where(
        and(
          eq(readingProgress.userId, userId),
          sql`${readingProgress.scrollProgress} < 100`
        )
      )
      .groupBy(sql`CASE 
        WHEN ${readingProgress.scrollProgress} < 25 THEN '0-25%'
        WHEN ${readingProgress.scrollProgress} < 50 THEN '25-50%'
        WHEN ${readingProgress.scrollProgress} < 75 THEN '50-75%'
        ELSE '75-100%'
      END`);

    return NextResponse.json({
      completionRate: Math.round(rate),
      averageReadingTime: Math.round(averageReadingTime[0]?.avgMinutes || 0),
      itemsRead: averageReadingTime[0]?.itemCount || 0,
      mostReadSections: mostReadSections.map((s) => ({
        itemId: s.itemId,
        itemTitle: s.itemTitle,
        avgProgress: Math.round(s.avgProgress),
        reads: Number(s.reads),
      })),
      abandonmentPoints: abandonmentPoints.map((p) => ({
        range: p.progressRange,
        count: Number(p.count),
      })),
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
