"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Trophy, Flame, BookOpen, Brain, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

type LeaderboardEntry = {
  userId: string;
  userName: string;
  userImage: string | null;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  quizzesCompleted: number;
  itemsRead: number;
};

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<"all" | "month" | "week">("all");
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/gamification/leaderboard?period=${period}&limit=20`
      );
      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Trophy className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Trophy className="w-6 h-6 text-orange-600" />;
      default:
        return (
          <span className="text-lg font-bold text-muted-foreground">
            #{index + 1}
          </span>
        );
    }
  };

  const getRankBgColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30";
      case 1:
        return "bg-gradient-to-r from-gray-400/10 to-gray-500/10 border-gray-400/30";
      case 2:
        return "bg-gradient-to-r from-orange-600/10 to-orange-700/10 border-orange-600/30";
      default:
        return "bg-card";
    }
  };

  return (
    <div className="space-y-6" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-600" />
          Ranking de Estudantes
        </h2>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        <Button
          onClick={() => setPeriod("all")}
          variant={period === "all" ? "default" : "outline"}
          size="sm"
        >
          Todos os Tempos
        </Button>
        <Button
          onClick={() => setPeriod("month")}
          variant={period === "month" ? "default" : "outline"}
          size="sm"
        >
          Este Mês
        </Button>
        <Button
          onClick={() => setPeriod("week")}
          variant={period === "week" ? "default" : "outline"}
          size="sm"
        >
          Esta Semana
        </Button>
      </div>

      {/* Leaderboard List */}
      {leaderboard.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhum dado de ranking disponível
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.userId}
              className={`border rounded-lg p-4 ${getRankBgColor(
                index
              )} transition-all hover:scale-[1.01]`}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="flex-shrink-0 w-12 flex items-center justify-center">
                  {getRankIcon(index)}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {entry.userImage ? (
                      <Image
                        src={entry.userImage}
                        alt={entry.userName}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold">
                          {entry.userName?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{entry.userName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Nível {entry.level}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-600" />
                      <span className="font-semibold">{entry.totalPoints}</span>
                      <span className="text-muted-foreground">pts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-600" />
                      <span className="font-semibold">{entry.currentStreak}</span>
                      <span className="text-muted-foreground">dias</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold">
                        {entry.quizzesCompleted}
                      </span>
                      <span className="text-muted-foreground">quizzes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold">{entry.itemsRead}</span>
                      <span className="text-muted-foreground">lidos</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
