import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checklist, userChecklistProgress } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { addPoints, updateStreak, incrementStat } from "@/lib/gamification";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const checklists = await db
      .select()
      .from(checklist)
      .where(eq(checklist.itemId, itemId))
      .orderBy(checklist.orderIndex);

    if (!session?.user?.id) {
      return NextResponse.json({ checklists, progress: [] });
    }

    const progress = await db
      .select({
        userId: userChecklistProgress.userId,
        checklistId: userChecklistProgress.checklistId,
        completed: userChecklistProgress.completed,
        completedAt: userChecklistProgress.completedAt,
        updatedAt: userChecklistProgress.updatedAt,
      })
      .from(userChecklistProgress)
      .where(eq(userChecklistProgress.userId, session.user.id));

    return NextResponse.json({ checklists, progress });
  } catch (error) {
    console.error("Error fetching checklists:", error);
    return NextResponse.json(
      { error: "Failed to fetch checklists" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { checklistId, completed } = body;

    const existing = await db
      .select({
        userId: userChecklistProgress.userId,
        checklistId: userChecklistProgress.checklistId,
        completed: userChecklistProgress.completed,
        completedAt: userChecklistProgress.completedAt,
        updatedAt: userChecklistProgress.updatedAt,
      })
      .from(userChecklistProgress)
      .where(
        and(
          eq(userChecklistProgress.userId, session.user.id),
          eq(userChecklistProgress.checklistId, checklistId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const wasCompleted = existing[0].completed;
      
      const updated = await db
        .update(userChecklistProgress)
        .set({
          completed,
          completedAt: completed ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userChecklistProgress.userId, session.user.id),
            eq(userChecklistProgress.checklistId, checklistId)
          )
        )
        .returning();

      if (completed && !wasCompleted) {
        await addPoints(session.user.id, 10, "checklist_completed", checklistId);
        await updateStreak(session.user.id);
        await incrementStat(session.user.id, "checklistsCompleted");
      }

      return NextResponse.json(updated[0]);
    } else {
      const created = await db
        .insert(userChecklistProgress)
        .values({
          userId: session.user.id,
          checklistId,
          completed,
          completedAt: completed ? new Date() : null,
          updatedAt: new Date(),
        })
        .returning();

      if (completed) {
        await addPoints(session.user.id, 10, "checklist_completed", checklistId);
        await updateStreak(session.user.id);
        await incrementStat(session.user.id, "checklistsCompleted");
      }

      return NextResponse.json(created[0]);
    }
  } catch (error) {
    console.error("Error updating checklist progress:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
