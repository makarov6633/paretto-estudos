import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quizQuestion, quizAnswer } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const questions = await db
      .select()
      .from(quizQuestion)
      .where(eq(quizQuestion.itemId, itemId))
      .orderBy(quizQuestion.orderIndex);

    if (!session?.user?.id) {
      return NextResponse.json({ questions, answers: [] });
    }

    const answers = await db
      .select()
      .from(quizAnswer)
      .where(eq(quizAnswer.userId, session.user.id));

    return NextResponse.json({ questions, answers });
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
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
    const { questionId, selectedAnswer } = body;

    const question = await db
      .select()
      .from(quizQuestion)
      .where(eq(quizQuestion.id, questionId))
      .limit(1);

    if (question.length === 0) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const isCorrect = question[0].correctAnswer === selectedAnswer;

    const answer = await db
      .insert(quizAnswer)
      .values({
        userId: session.user.id,
        questionId,
        selectedAnswer,
        isCorrect,
        attemptedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      ...answer[0],
      explanation: question[0].explanation,
      correctAnswer: question[0].correctAnswer,
    });
  } catch (error) {
    console.error("Error submitting quiz answer:", error);
    return NextResponse.json(
      { error: "Failed to submit answer" },
      { status: 500 }
    );
  }
}
