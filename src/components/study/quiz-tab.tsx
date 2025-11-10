"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X, AlertCircle, Lightbulb, Trophy } from "lucide-react";
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

  if (questions.length === 0 && !loading) {
    return (
      <div className="quiz-empty">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-50 dark:from-purple-900/40 dark:to-indigo-900/40 flex items-center justify-center mb-4">
          <Lightbulb className="w-8 h-8 text-purple-500 dark:text-purple-400" strokeWidth={1.5} />
        </div>
        <p className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">Nenhum quiz disponível</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Quizzes ajudam a fixar o conteúdo estudado
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="quiz-empty">
        <p className="text-gray-500 dark:text-gray-400">Carregando quiz...</p>
      </div>
    );
  }

  const question = questions[currentQuestion];
  if (!question) {
    return null;
  }
  
  const isLastQuestion = currentQuestion === questions.length - 1;
  const alreadyAnswered = hasAnswered(question.id);

  return (
    <div className="quiz-container">
      {/* Progress bar */}
      <div className="quiz-progress">
        <div className="quiz-progress-bar" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
      </div>

      {/* Score display */}
      <div className="quiz-header">
        <div className="quiz-score">
          <span className="quiz-score-label">Questão</span>
          <span className="quiz-score-value">{currentQuestion + 1}/{questions.length}</span>
        </div>
        <div className="quiz-score">
          <span className="quiz-score-label">Acertos</span>
          <span className="quiz-score-value">{correctCount}/{totalAnswered}</span>
        </div>
      </div>

      {/* Question */}
      <div className="quiz-question">
        <h3 className="quiz-question-text">{question.question}</h3>
      </div>

      {/* Options */}
      <div className="quiz-options">
        {question.options.map((option, index) => {
          const isSelected = selectedOption === index;
          const isCorrect = result?.correctAnswer === index;
          const showCorrect = submitted && isCorrect;
          const showIncorrect = submitted && isSelected && !result?.isCorrect;

          return (
            <button
              key={index}
              onClick={() => !submitted && !alreadyAnswered && setSelectedOption(index)}
              disabled={submitted || alreadyAnswered}
              className={cn(
                "quiz-option",
                isSelected && !submitted && "quiz-option-selected",
                showCorrect && "quiz-option-correct",
                showIncorrect && "quiz-option-incorrect",
                (submitted || alreadyAnswered) && "quiz-option-disabled"
              )}
            >
              <div className={cn(
                "quiz-option-indicator",
                isSelected && !submitted && "quiz-option-indicator-selected",
                showCorrect && "quiz-option-indicator-correct",
                showIncorrect && "quiz-option-indicator-incorrect"
              )}>
                {showCorrect && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                {showIncorrect && <X className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                {!submitted && !alreadyAnswered && (
                  <span className="text-xs font-semibold">{String.fromCharCode(65 + index)}</span>
                )}
              </div>
              <span className="quiz-option-text">{option}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {submitted && result && (
        <div className={cn(
          "quiz-explanation",
          result.isCorrect ? "quiz-explanation-correct" : "quiz-explanation-incorrect"
        )}>
          <div className="flex items-start gap-2.5">
            {result.isCorrect ? (
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                <X className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-sm mb-1">
                {result.isCorrect ? "Resposta Correta!" : "Resposta Incorreta"}
              </p>
              {result.explanation && (
                <p className="text-sm opacity-90">{result.explanation}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Already answered alert */}
      {alreadyAnswered && !submitted && (
        <div className="quiz-alert">
          <AlertCircle className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" strokeWidth={2} />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Você já respondeu esta questão
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="quiz-actions">
        {!submitted && !alreadyAnswered && (
          <button
            onClick={submitAnswer}
            disabled={selectedOption === null}
            className="quiz-button-submit"
          >
            Verificar Resposta
          </button>
        )}
        {(submitted || alreadyAnswered) && !isLastQuestion && (
          <button onClick={nextQuestion} className="quiz-button-next">
            Próxima Questão
          </button>
        )}
        {isLastQuestion && totalAnswered === questions.length && (
          <div className="quiz-complete">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-3">
              <Trophy className="w-7 h-7 text-white" strokeWidth={2} />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-1">Quiz Completo!</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Você acertou {correctCount} de {questions.length} questões
            </p>
            <div className="quiz-score-badge">
              {Math.round((correctCount / questions.length) * 100)}%
            </div>
            <button onClick={resetQuiz} className="quiz-button-reset">
              Refazer Quiz
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .quiz-container {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .quiz-progress {
          height: 0.25rem;
          background: rgba(120, 120, 128, 0.12);
          border-radius: 0.125rem;
          overflow: hidden;
        }

        .dark .quiz-progress {
          background: rgba(235, 235, 245, 0.12);
        }

        .quiz-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #AF52DE 0%, #5E5CE6 100%);
          border-radius: 0.125rem;
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .quiz-header {
          display: flex;
          gap: 0.75rem;
        }

        .quiz-score {
          flex: 1;
          padding: 0.75rem 1rem;
          background: rgba(120, 120, 128, 0.08);
          border-radius: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .dark .quiz-score {
          background: rgba(235, 235, 245, 0.08);
        }

        .quiz-score-label {
          font-size: 0.6875rem;
          font-weight: 500;
          color: rgba(60, 60, 67, 0.6);
          letter-spacing: -0.01em;
        }

        .dark .quiz-score-label {
          color: rgba(235, 235, 245, 0.6);
        }

        .quiz-score-value {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1d1d1f;
          letter-spacing: -0.02em;
        }

        .dark .quiz-score-value {
          color: #f5f5f7;
        }

        .quiz-question {
          padding: 1.5rem;
          background: linear-gradient(to bottom,
            rgba(120, 120, 128, 0.04) 0%,
            rgba(120, 120, 128, 0.02) 100%
          );
          border-radius: 1rem;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }

        .dark .quiz-question {
          background: linear-gradient(to bottom,
            rgba(235, 235, 245, 0.06) 0%,
            rgba(235, 235, 245, 0.03) 100%
          );
          border-color: rgba(255, 255, 255, 0.06);
        }

        .quiz-question-text {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
          font-size: 1.0625rem;
          line-height: 1.5;
          font-weight: 600;
          color: #1d1d1f;
          letter-spacing: -0.02em;
        }

        .dark .quiz-question-text {
          color: #f5f5f7;
        }

        .quiz-options {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }

        .quiz-option {
          display: flex;
          align-items: flex-start;
          gap: 0.875rem;
          width: 100%;
          text-align: left;
          padding: 1rem 1.125rem;
          background: rgba(255, 255, 255, 0.8);
          border: 1.5px solid rgba(0, 0, 0, 0.08);
          border-radius: 0.875rem;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          min-height: 3.25rem;
        }

        .dark .quiz-option {
          background: rgba(28, 28, 30, 0.8);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .quiz-option:hover:not(.quiz-option-disabled) {
          background: rgba(255, 255, 255, 1);
          border-color: rgba(175, 82, 222, 0.3);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transform: translateY(-1px);
        }

        .dark .quiz-option:hover:not(.quiz-option-disabled) {
          background: rgba(28, 28, 30, 1);
          border-color: rgba(175, 82, 222, 0.4);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .quiz-option:active:not(.quiz-option-disabled) {
          transform: scale(0.99);
        }

        .quiz-option-selected {
          background: rgba(175, 82, 222, 0.08);
          border-color: #AF52DE;
        }

        .dark .quiz-option-selected {
          background: rgba(175, 82, 222, 0.12);
          border-color: #BF5AF2;
        }

        .quiz-option-correct {
          background: rgba(52, 199, 89, 0.1);
          border-color: #34C759;
          box-shadow: 0 2px 12px rgba(52, 199, 89, 0.15);
        }

        .dark .quiz-option-correct {
          background: rgba(52, 199, 89, 0.15);
          border-color: #30D158;
        }

        .quiz-option-incorrect {
          background: rgba(255, 59, 48, 0.08);
          border-color: #FF3B30;
          box-shadow: 0 2px 12px rgba(255, 59, 48, 0.12);
        }

        .dark .quiz-option-incorrect {
          background: rgba(255, 69, 58, 0.12);
          border-color: #FF453A;
        }

        .quiz-option-disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .quiz-option-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 50%;
          border: 1.5px solid rgba(120, 120, 128, 0.3);
          background: transparent;
          flex-shrink: 0;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          color: rgba(60, 60, 67, 0.6);
        }

        .dark .quiz-option-indicator {
          border-color: rgba(235, 235, 245, 0.3);
          color: rgba(235, 235, 245, 0.6);
        }

        .quiz-option-indicator-selected {
          border-color: #AF52DE;
          background: rgba(175, 82, 222, 0.12);
          color: #AF52DE;
        }

        .dark .quiz-option-indicator-selected {
          border-color: #BF5AF2;
          background: rgba(191, 90, 242, 0.16);
          color: #BF5AF2;
        }

        .quiz-option-indicator-correct {
          border-color: #34C759;
          background: linear-gradient(135deg, #34C759 0%, #30A14E 100%);
          box-shadow: 0 2px 8px rgba(52, 199, 89, 0.3);
        }

        .dark .quiz-option-indicator-correct {
          background: linear-gradient(135deg, #30D158 0%, #32D74B 100%);
        }

        .quiz-option-indicator-incorrect {
          border-color: #FF3B30;
          background: linear-gradient(135deg, #FF3B30 0%, #D70015 100%);
          box-shadow: 0 2px 8px rgba(255, 59, 48, 0.3);
        }

        .dark .quiz-option-indicator-incorrect {
          background: linear-gradient(135deg, #FF453A 0%, #FF3B30 100%);
        }

        .quiz-option-text {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
          font-size: 0.9375rem;
          line-height: 1.4;
          color: #1d1d1f;
          font-weight: 400;
          letter-spacing: -0.01em;
        }

        .dark .quiz-option-text {
          color: #f5f5f7;
        }

        .quiz-explanation {
          padding: 1rem 1.125rem;
          border-radius: 0.875rem;
          animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .quiz-explanation-correct {
          background: rgba(52, 199, 89, 0.1);
          border: 1px solid rgba(52, 199, 89, 0.2);
          color: #1d1d1f;
        }

        .dark .quiz-explanation-correct {
          background: rgba(52, 199, 89, 0.12);
          border-color: rgba(48, 209, 88, 0.25);
          color: #f5f5f7;
        }

        .quiz-explanation-incorrect {
          background: rgba(255, 59, 48, 0.08);
          border: 1px solid rgba(255, 59, 48, 0.2);
          color: #1d1d1f;
        }

        .dark .quiz-explanation-incorrect {
          background: rgba(255, 69, 58, 0.12);
          border-color: rgba(255, 69, 58, 0.25);
          color: #f5f5f7;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .quiz-alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.125rem;
          background: rgba(120, 120, 128, 0.08);
          border: 1px solid rgba(120, 120, 128, 0.12);
          border-radius: 0.875rem;
        }

        .dark .quiz-alert {
          background: rgba(235, 235, 245, 0.08);
          border-color: rgba(235, 235, 245, 0.12);
        }

        .quiz-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .quiz-button-submit,
        .quiz-button-next {
          width: 100%;
          padding: 0.875rem;
          border-radius: 0.875rem;
          background: linear-gradient(180deg, #AF52DE 0%, #5E5CE6 100%);
          color: white;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          border: none;
          box-shadow: 0 2px 8px rgba(175, 82, 222, 0.3);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .quiz-button-submit:hover:not(:disabled),
        .quiz-button-next:hover {
          background: linear-gradient(180deg, #BF5AF2 0%, #5E5CE6 100%);
          box-shadow: 0 4px 16px rgba(175, 82, 222, 0.4);
          transform: translateY(-1px);
        }

        .quiz-button-submit:active:not(:disabled),
        .quiz-button-next:active {
          transform: translateY(0);
        }

        .quiz-button-submit:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .quiz-complete {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 1.5rem;
          background: linear-gradient(to bottom,
            rgba(175, 82, 222, 0.05) 0%,
            rgba(94, 92, 230, 0.05) 100%
          );
          border: 1px solid rgba(175, 82, 222, 0.15);
          border-radius: 1rem;
          text-align: center;
        }

        .dark .quiz-complete {
          background: linear-gradient(to bottom,
            rgba(191, 90, 242, 0.08) 0%,
            rgba(94, 92, 230, 0.08) 100%
          );
          border-color: rgba(191, 90, 242, 0.2);
        }

        .quiz-score-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
          color: #AF52DE;
          margin-bottom: 1rem;
          letter-spacing: -0.03em;
        }

        .dark .quiz-score-badge {
          color: #BF5AF2;
        }

        .quiz-button-reset {
          padding: 0.625rem 1.5rem;
          border-radius: 0.75rem;
          background: rgba(120, 120, 128, 0.12);
          color: #1d1d1f;
          font-size: 0.9375rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          border: none;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .dark .quiz-button-reset {
          background: rgba(235, 235, 245, 0.12);
          color: #f5f5f7;
        }

        .quiz-button-reset:hover {
          background: rgba(120, 120, 128, 0.18);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }

        .dark .quiz-button-reset:hover {
          background: rgba(235, 235, 245, 0.18);
        }

        .quiz-button-reset:active {
          transform: scale(0.98);
        }

        .quiz-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 1.5rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
