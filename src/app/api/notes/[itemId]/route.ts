import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userNote } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { addPoints, updateStreak, incrementStat } from "@/lib/gamification";
import { nanoid } from "nanoid";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notes = await db
      .select()
      .from(userNote)
      .where(
        and(
          eq(userNote.userId, session.user.id),
          eq(userNote.itemId, itemId)
        )
      )
      .orderBy(userNote.updatedAt);

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, sectionId, isStructured, tags } = body;

    const note = await db
      .insert(userNote)
      .values({
        id: nanoid(),
        userId: session.user.id,
        itemId,
        sectionId: sectionId || null,
        content,
        isStructured: isStructured || false,
        tags: tags || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await addPoints(session.user.id, 15, "note_created", note[0].id);
    await updateStreak(session.user.id);
    await incrementStat(session.user.id, "notesCreated");

    return NextResponse.json(note[0]);
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const { id, content, tags } = body;

    const updated = await db
      .update(userNote)
      .set({
        content,
        tags: tags || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userNote.id, id),
          eq(userNote.userId, session.user.id)
        )
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get("noteId");

    if (!noteId) {
      return NextResponse.json({ error: "Note ID required" }, { status: 400 });
    }

    await db
      .delete(userNote)
      .where(
        and(
          eq(userNote.id, noteId),
          eq(userNote.userId, session.user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
