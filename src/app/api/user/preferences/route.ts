import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userPreference } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { categories, readingTime } = body;

    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: "Categories are required" },
        { status: 400 }
      );
    }

    await db
      .delete(userPreference)
      .where(eq(userPreference.userId, session.user.id));

    const preferences = categories.map((tag) => ({
      id: nanoid(),
      userId: session.user.id,
      tag,
      weight: 10,
      updatedAt: new Date(),
    }));

    await db.insert(userPreference).values(preferences);

    return NextResponse.json({ success: true, readingTime });
  } catch (error) {
    console.error("Error saving preferences:", error);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await db
      .select()
      .from(userPreference)
      .where(eq(userPreference.userId, session.user.id));

    return NextResponse.json({
      categories: preferences.map((p) => p.tag),
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}
