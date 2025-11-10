"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type QuizQuestion = {
  id: string;
  itemId: string | null;
  orderIndex: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string | null;
  createdAt: Date;
};

type QuizAnswer = {
  id: string;
  userId: string;
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  attemptedAt: Date;
};

type QuizTabProps = {
  itemId: string;
};

export function QuizTab({ itemId }: QuizTabProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    correctAnswer: number;
    explanation: string | null;
  } | null>(null);

  const fetchQuiz = useCallback(async () => {
    try {
      const response = await fetch(`/api/quiz/${itemId}`);
      const data = await response.json();
      setQuestions(data.questions || []);
      setAnswers(data.answers || []);
    } catch (error) {
      console.error("Error fetching quiz:", error);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const submitAnswer = async () => {
    if (selectedOption === null) return;

    const question = questions[currentQuestion];
    try {
      const response = await fetch(`/api/quiz/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          selectedAnswer: selectedOption,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult({
          isCorrect: data.isCorrect,
          correctAnswer: data.correctAnswer,
          explanation: data.explanation,
        });
        setSubmitted(true);
        setAnswers((prev) => [...prev, data]);
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
      setSubmitted(false);
      setResult(null);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setSubmitted(false);
    setResult(null);
  };

  const hasAnswered = (questionId: string) => {
    return answers.some((a) => a.questionId === questionId);
  };

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const totalAnswered = answers.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Carregando quiz...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-2">Nenhum quiz disponível</p>
        <p className="text-sm text-muted-foreground">
          Quizzes ajudam a fixar o conteúdo estudado
        </p>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const alreadyAnswered = hasAnswered(question.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          Questão {currentQuestion + 1} de {questions.length}
        </span>
        <span className="text-muted-foreground">
          {correctCount} corretas de {totalAnswered}
        </span>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{question.question}</h3>

        <div className="space-y-2">
          {question.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrect = result?.correctAnswer === index;
            const showCorrect = submitted && isCorrect;
            const showIncorrect = submitted && isSelected && !result?.isCorrect;

            return (
              <button
                key={index}
                onClick={() => !submitted && setSelectedOption(index)}
                disabled={submitted || alreadyAnswered}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-all",
                  "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                  isSelected && !submitted && "border-primary bg-primary/5",
                  showCorrect && "border-green-500 bg-green-500/10",
                  showIncorrect && "border-red-500 bg-red-500/10",
                  (submitted || alreadyAnswered) && "cursor-not-allowed"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5",
                      isSelected && !submitted && "border-primary bg-primary/10",
                      showCorrect && "border-green-500 bg-green-500",
                      showIncorrect && "border-red-500 bg-red-500"
                    )}
                  >
                    {showCorrect && <Check className="w-4 h-4 text-white" />}
                    {showIncorrect && <X className="w-4 h-4 text-white" />}
                    {!submitted && !alreadyAnswered && (
                      <span className="text-xs font-medium">{String.fromCharCode(65 + index)}</span>
                    )}
                  </div>
                  <span className="flex-1">{option}</span>
                </div>
              </button>
            );
          })}
        </div>

        {submitted && result && (
          <div
            className={cn(
              "p-4 rounded-lg border",
              result.isCorrect
                ? "bg-green-500/10 border-green-500/30"
                : "bg-red-500/10 border-red-500/30"
            )}
          >
            <div className="flex items-start gap-2 mb-2">
              {result.isCorrect ? (
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <span className="font-medium">
                {result.isCorrect ? "Correto!" : "Incorreto"}
              </span>
            </div>
            {result.explanation && (
              <p className="text-sm text-muted-foreground ml-7">{result.explanation}</p>
            )}
          </div>
        )}

        {alreadyAnswered && !submitted && (
          <div className="p-4 rounded-lg border bg-muted/50 border-muted">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">
                Você já respondeu esta questão
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {!submitted && !alreadyAnswered && (
          <Button
            onClick={submitAnswer}
            disabled={selectedOption === null}
            className="flex-1"
          >
            Enviar Resposta
          </Button>
        )}
        {(submitted || alreadyAnswered) && !isLastQuestion && (
          <Button onClick={nextQuestion} className="flex-1">
            Próxima Questão
          </Button>
        )}
        {isLastQuestion && totalAnswered === questions.length && (
          <div className="w-full p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
            <p className="font-medium text-primary">🎉 Quiz completo!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Você acertou {correctCount} de {questions.length} questões (
              {Math.round((correctCount / questions.length) * 100)}%)
            </p>
            <Button onClick={resetQuiz} variant="outline" className="mt-3">
              Refazer Quiz
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
