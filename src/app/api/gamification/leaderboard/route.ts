import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userGamification, user } from "@/lib/schema";
import { desc, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all"; // 'all', 'month', 'week'
    const limit = parseInt(searchParams.get("limit") || "10");

    let dateFilter = sql`true`;

    if (period === "month") {
      dateFilter = sql`${userGamification.updatedAt} >= NOW() - INTERVAL '30 days'`;
    } else if (period === "week") {
      dateFilter = sql`${userGamification.updatedAt} >= NOW() - INTERVAL '7 days'`;
    }

    const leaderboard = await db
      .select({
        userId: userGamification.userId,
        userName: user.name,
        userImage: user.image,
        totalPoints: userGamification.totalPoints,
        currentStreak: userGamification.currentStreak,
        longestStreak: userGamification.longestStreak,
        level: userGamification.level,
        itemsRead: userGamification.itemsRead,
      })
      .from(userGamification)
      .innerJoin(user, sql`${userGamification.userId} = ${user.id}`)
      .where(dateFilter)
      .orderBy(desc(userGamification.totalPoints))
      .limit(limit);

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
