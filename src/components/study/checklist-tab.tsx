"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Circle, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

type ChecklistItem = {
  id: string;
  itemId: string | null;
  orderIndex: number;
  title: string;
  description: string | null;
  createdAt: Date;
};

type ChecklistProgress = {
  userId: string;
  checklistId: string;
  completed: boolean;
  completedAt: Date | null;
  updatedAt: Date;
};

type ChecklistTabProps = {
  itemId: string;
};

export function ChecklistTab({ itemId }: ChecklistTabProps) {
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [progress, setProgress] = useState<ChecklistProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchChecklists = useCallback(async () => {
    try {
      const response = await fetch(`/api/checklist/${itemId}`);
      const data = await response.json();
      setChecklists(data.checklists || []);
      setProgress(data.progress || []);
    } catch (error) {
      console.error("Error fetching checklists:", error);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    fetchChecklists();
  }, [fetchChecklists]);

  const toggleChecklistItem = async (checklistId: string, currentStatus: boolean) => {
    setUpdating(checklistId);
    try {
      const response = await fetch(`/api/checklist/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklistId,
          completed: !currentStatus,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setProgress((prev) => {
          const existing = prev.findIndex((p) => p.checklistId === checklistId);
          if (existing >= 0) {
            const newProgress = [...prev];
            newProgress[existing] = updated;
            return newProgress;
          }
          return [...prev, updated];
        });
      }
    } catch (error) {
      console.error("Error updating checklist:", error);
    } finally {
      setUpdating(null);
    }
  };

  const isCompleted = (checklistId: string) => {
    return progress.find((p) => p.checklistId === checklistId)?.completed || false;
  };

  const completedCount = checklists.filter((c) => isCompleted(c.id)).length;
  const totalCount = checklists.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (checklists.length === 0 && !loading) {
    return (
      <div className="checklist-empty">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/40 flex items-center justify-center mb-4">
          <Circle className="w-8 h-8 text-green-500 dark:text-green-400" strokeWidth={1.5} />
        </div>
        <p className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">Nenhum checklist disponível</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Checklists ajudam você a acompanhar seu progresso
        </p>
      </div>
    );
  }

  return (
    <div className="checklist-container">
      {/* Progress Header */}
      <div className="checklist-progress-header">
        <div className="flex items-center justify-between mb-2">
          <span className="checklist-progress-label">Progresso Geral</span>
          <span className="checklist-progress-value">
            {completedCount} de {totalCount}
          </span>
        </div>
        <div className="checklist-progress-track">
          <div
            className="checklist-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {totalCount > 0 && (
          <p className="checklist-progress-text">
            {progressPercent === 100 ? '✨ Completo!' : `${Math.round(progressPercent)}% concluído`}
          </p>
        )}
      </div>

      {/* Checklist Items */}
      <div className="checklist-items">
        {checklists.map((item, index) => {
          const completed = isCompleted(item.id);
          const isUpdating = updating === item.id;

          return (
            <button
              key={item.id}
              onClick={() => toggleChecklistItem(item.id, completed)}
              disabled={isUpdating}
              className={cn(
                "checklist-item",
                completed && "checklist-item-completed",
                isUpdating && "checklist-item-updating"
              )}
              style={{
                animationDelay: `${index * 40}ms`,
              }}
            >
              <div className="flex items-start gap-3 w-full">
                <div className={cn(
                  "checklist-checkbox",
                  completed && "checklist-checkbox-checked"
                )}>
                  {completed && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={cn(
                    "checklist-item-title",
                    completed && "checklist-item-title-completed"
                  )}>
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="checklist-item-description">{item.description}</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Completion Celebration */}
      {completedCount === totalCount && totalCount > 0 && (
        <div className="checklist-complete">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-3">
            <Trophy className="w-7 h-7 text-white" strokeWidth={2} />
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-1">
            Checklist Completo!
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Você concluiu todos os {totalCount} itens deste resumo
          </p>
        </div>
      )}

      <style jsx>{`
        .checklist-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .checklist-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 1.5rem;
          text-align: center;
        }

        .checklist-progress-header {
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .dark .checklist-progress-header {
          border-bottom-color: rgba(255, 255, 255, 0.06);
        }

        .checklist-progress-label {
          font-size: 0.6875rem;
          font-weight: 500;
          color: rgba(60, 60, 67, 0.6);
          letter-spacing: -0.01em;
          text-transform: uppercase;
        }

        .dark .checklist-progress-label {
          color: rgba(235, 235, 245, 0.6);
        }

        .checklist-progress-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #34C759;
          letter-spacing: -0.01em;
        }

        .dark .checklist-progress-value {
          color: #30D158;
        }

        .checklist-progress-track {
          height: 0.375rem;
          background: rgba(120, 120, 128, 0.12);
          border-radius: 0.1875rem;
          overflow: hidden;
          margin-top: 0.5rem;
        }

        .dark .checklist-progress-track {
          background: rgba(235, 235, 245, 0.12);
        }

        .checklist-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #34C759 0%, #30A14E 100%);
          border-radius: 0.1875rem;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .checklist-progress-fill::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
          animation: shimmer 2s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        .checklist-progress-text {
          font-size: 0.75rem;
          color: rgba(60, 60, 67, 0.6);
          text-align: center;
          margin-top: 0.5rem;
          letter-spacing: -0.01em;
        }

        .dark .checklist-progress-text {
          color: rgba(235, 235, 245, 0.6);
        }

        .checklist-items {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }

        .checklist-item {
          width: 100%;
          text-align: left;
          padding: 1rem 1.125rem;
          background: rgba(255, 255, 255, 0.6);
          border: 1.5px solid rgba(0, 0, 0, 0.08);
          border-radius: 0.875rem;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          min-height: 3.75rem;
          animation: checklistSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) backwards;
        }

        .dark .checklist-item {
          background: rgba(28, 28, 30, 0.6);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .checklist-item:hover:not(.checklist-item-updating) {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(52, 199, 89, 0.3);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transform: translateY(-1px);
        }

        .dark .checklist-item:hover:not(.checklist-item-updating) {
          background: rgba(28, 28, 30, 0.9);
          border-color: rgba(48, 209, 88, 0.4);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .checklist-item:active:not(.checklist-item-updating) {
          transform: scale(0.99);
        }

        .checklist-item-completed {
          background: rgba(52, 199, 89, 0.08);
          border-color: rgba(52, 199, 89, 0.3);
        }

        .dark .checklist-item-completed {
          background: rgba(48, 209, 88, 0.12);
          border-color: rgba(48, 209, 88, 0.35);
        }

        .checklist-item-updating {
          opacity: 0.6;
          cursor: wait;
        }

        @keyframes checklistSlideIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .checklist-checkbox {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 50%;
          border: 1.5px solid rgba(120, 120, 128, 0.3);
          background: transparent;
          flex-shrink: 0;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .dark .checklist-checkbox {
          border-color: rgba(235, 235, 245, 0.3);
        }

        .checklist-checkbox-checked {
          border-color: #34C759;
          background: linear-gradient(135deg, #34C759 0%, #30A14E 100%);
          box-shadow: 0 2px 8px rgba(52, 199, 89, 0.3);
        }

        .dark .checklist-checkbox-checked {
          background: linear-gradient(135deg, #30D158 0%, #32D74B 100%);
        }

        .checklist-item-title {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
          font-size: 0.9375rem;
          line-height: 1.4;
          font-weight: 500;
          color: #1d1d1f;
          letter-spacing: -0.01em;
          margin-bottom: 0.25rem;
          transition: all 0.25s ease;
        }

        .dark .checklist-item-title {
          color: #f5f5f7;
        }

        .checklist-item-title-completed {
          text-decoration: line-through;
          color: rgba(60, 60, 67, 0.5);
        }

        .dark .checklist-item-title-completed {
          color: rgba(235, 235, 245, 0.5);
        }

        .checklist-item-description {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
          font-size: 0.8125rem;
          line-height: 1.4;
          color: rgba(60, 60, 67, 0.6);
          letter-spacing: -0.01em;
        }

        .dark .checklist-item-description {
          color: rgba(235, 235, 245, 0.6);
        }

        .checklist-complete {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 1.5rem;
          background: linear-gradient(to bottom,
            rgba(52, 199, 89, 0.08) 0%,
            rgba(48, 161, 78, 0.08) 100%
          );
          border: 1px solid rgba(52, 199, 89, 0.2);
          border-radius: 1rem;
          text-align: center;
          animation: celebrationBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .dark .checklist-complete {
          background: linear-gradient(to bottom,
            rgba(48, 209, 88, 0.1) 0%,
            rgba(50, 215, 75, 0.1) 100%
          );
          border-color: rgba(48, 209, 88, 0.25);
        }

        @keyframes celebrationBounce {
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(10px);
          }
          50% {
            transform: scale(1.02);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
