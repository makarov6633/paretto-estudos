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
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Progresso</span>
          <span className="text-muted-foreground">
            {completedCount} de {totalCount}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {checklists.map((item) => {
          const completed = isCompleted(item.id);
          const isUpdating = updating === item.id;

          return (
            <button
              key={item.id}
              onClick={() => toggleChecklistItem(item.id, completed)}
              disabled={isUpdating}
              className={cn(
                "w-full text-left p-4 rounded-lg border transition-all",
                "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                completed && "bg-muted/50 border-primary/30",
                isUpdating && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-all",
                    completed
                      ? "bg-primary border-primary"
                      : "border-muted-foreground/30 hover:border-primary/50"
                  )}
                >
                  {completed && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className={cn(
                      "font-medium mb-1 transition-all",
                      completed && "line-through text-muted-foreground"
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
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
          <p className="font-medium text-primary">🎉 Checklist completo!</p>
          <p className="text-sm text-muted-foreground mt-1">
            Você concluiu todos os itens deste resumo
          </p>
        </div>
      )}
    </div>
  );
}
