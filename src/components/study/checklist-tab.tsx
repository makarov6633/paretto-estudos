"use client";

import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";
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
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-2">Nenhum checklist disponível</p>
        <p className="text-sm text-muted-foreground">
          Checklists ajudam você a acompanhar seu progresso de estudo
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm font-medium">
          <span>Progresso Geral</span>
          <span className="text-emerald-600 dark:text-emerald-400">
            {completedCount} de {totalCount}
          </span>
        </div>
        <div className="relative h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer" />
          </div>
        </div>
        {totalCount > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {progressPercent === 100 ? '✨ Completo!' : `${Math.round(progressPercent)}% concluído`}
          </p>
        )}
      </div>

      <div className="space-y-2.5">
        {checklists.map((item) => {
          const completed = isCompleted(item.id);
          const isUpdating = updating === item.id;

          return (
            <button
              key={item.id}
              onClick={() => toggleChecklistItem(item.id, completed)}
              disabled={isUpdating}
              className={cn(
                "group w-full text-left rounded-xl border-2 transition-all duration-300",
                "hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10",
                "focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
                "active:scale-[0.98]",
                completed && "bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-300 dark:border-emerald-700",
                !completed && "border-gray-200 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-900/50",
                isUpdating && "opacity-60 cursor-wait",
                "p-4 sm:p-4 min-h-[60px]" // Mobile touch optimization
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300",
                    completed
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 border-transparent shadow-md shadow-emerald-500/30"
                      : "border-gray-300 dark:border-gray-700 group-hover:border-emerald-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30"
                  )}
                >
                  {completed && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className={cn(
                      "font-semibold mb-1 transition-all duration-300",
                      completed && "line-through text-muted-foreground",
                      !completed && "text-gray-900 dark:text-gray-100"
                    )}
                  >
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {completedCount === totalCount && totalCount > 0 && (
        <div className="relative p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/50 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-bold text-lg text-emerald-700 dark:text-emerald-300 mb-1">
              Checklist Completo!
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Você concluiu todos os {totalCount} itens deste resumo
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
