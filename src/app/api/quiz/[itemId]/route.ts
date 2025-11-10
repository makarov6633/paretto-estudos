import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quizQuestion, quizAnswer } from "@/lib/schema";
import { eq } from "drizzle-orm";
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
        id: nanoid(),
        userId: session.user.id,
        questionId,
        selectedAnswer,
        isCorrect,
        attemptedAt: new Date(),
      })
      .returning();

    if (isCorrect) {
      await addPoints(session.user.id, 20, "quiz_correct", questionId);
    } else {
      await addPoints(session.user.id, 5, "quiz_attempted", questionId);
    }
    
    await updateStreak(session.user.id);

    const allQuestions = await db
      .select()
      .from(quizQuestion)
      .where(eq(quizQuestion.itemId, question[0].itemId || ""));

    const allAnswers = await db
      .select()
      .from(quizAnswer)
      .where(eq(quizAnswer.userId, session.user.id));

    const quizQuestionIds = new Set(allQuestions.map((q) => q.id));
    const answeredForThisQuiz = allAnswers.filter((a) =>
      quizQuestionIds.has(a.questionId)
    );

    if (answeredForThisQuiz.length === allQuestions.length) {
      await incrementStat(session.user.id, "quizzesCompleted");
    }

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
