import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readingProgress } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { error: "itemId is required" },
        { status: 400 }
      );
    }

    const progress = await db
      .select()
      .from(readingProgress)
      .where(
        and(
          eq(readingProgress.userId, session.user.id),
          eq(readingProgress.itemId, itemId)
        )
      )
      .limit(1);

    if (progress.length === 0) {
      return NextResponse.json({
        scrollProgress: 0,
        currentSectionIndex: 0,
        lastReadAt: null,
      });
    }

    return NextResponse.json(progress[0]);
  } catch (error) {
    console.error("Error fetching reading progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, scrollProgress, currentSectionIndex } = body;

    if (!itemId || scrollProgress === undefined) {
      return NextResponse.json(
        { error: "itemId and scrollProgress are required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const existingProgress = await db
      .select()
      .from(readingProgress)
      .where(
        and(
          eq(readingProgress.userId, session.user.id),
          eq(readingProgress.itemId, itemId)
        )
      )
      .limit(1);

    if (existingProgress.length > 0) {
      await db
        .update(readingProgress)
        .set({
          scrollProgress,
          currentSectionIndex: currentSectionIndex ?? 0,
          lastReadAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(readingProgress.userId, session.user.id),
            eq(readingProgress.itemId, itemId)
          )
        );
    } else {
      await db.insert(readingProgress).values({
        userId: session.user.id,
        itemId,
        scrollProgress,
        currentSectionIndex: currentSectionIndex ?? 0,
        lastReadAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving reading progress:", error);
    return NextResponse.json(
      { error: "Failed to save progress" },
      { status: 500 }
    );
  }
}
