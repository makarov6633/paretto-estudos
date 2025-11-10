"use client";

import { useCallback, useEffect, useState } from "react";
import { Trophy, Flame, TrendingUp, BookOpen, Brain, CheckSquare, StickyNote, Award } from "lucide-react";

type UserStats = {
  userId: string;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: Date | null;
  level: number;
  itemsRead: number;
  updatedAt: Date;
};

type Badge = {
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    rarity: string;
    points: number;
  };
  earnedAt: Date;
  seen: boolean;
};

type Transaction = {
  id: string;
  points: number;
  reason: string;
  createdAt: Date;
};

export function ProgressDashboard() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [unseenBadges, setUnseenBadges] = useState<Badge[]>([]);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/gamification/profile");
      const data = await response.json();
      setStats(data.stats);
      setBadges(data.badges || []);
      setTransactions(data.recentTransactions || []);
      setUnseenBadges(data.unseenBadges || []);

      if (data.unseenBadges && data.unseenBadges.length > 0) {
        setTimeout(() => {
          markBadgesSeen(data.unseenBadges.map((b: Badge) => b.badge.id));
        }, 3000);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const markBadgesSeen = async (badgeIds: string[]) => {
    try {
      await fetch("/api/gamification/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_badges_seen", badgeIds }),
      });
      setUnseenBadges([]);
    } catch (error) {
      console.error("Error marking badges as seen:", error);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "text-gray-600 dark:text-gray-400";
      case "rare":
        return "text-blue-600 dark:text-blue-400";
      case "epic":
        return "text-purple-600 dark:text-purple-400";
      case "legendary":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "text-gray-600";
    }
  };

  const formatReason = (reason: string) => {
    const reasons: Record<string, string> = {
      quiz_correct: "Quiz correto",
      quiz_attempted: "Quiz tentado",
      checklist_completed: "Checklist completo",
      note_created: "Nota criada",
      item_read: "Resumo lido",
    };
    return reasons[reason] || reason.replace(/_/g, " ");
  };

  if (!stats && !loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Erro ao carregar progresso</div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
      {/* New Badges Notification */}
      {unseenBadges.length > 0 && (
        <div className="fixed top-20 right-4 z-50 max-w-sm animate-in slide-in-from-right">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 rounded-lg shadow-2xl">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8" />
              <div>
                <h3 className="font-bold text-lg">Nova Conquista!</h3>
                <p className="text-sm opacity-90">
                  {unseenBadges[0].badge.icon} {unseenBadges[0].badge.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-muted-foreground">Pontos</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalPoints}</p>
          <p className="text-xs text-muted-foreground">Nível {stats.level}</p>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-muted-foreground">Sequência</span>
          </div>
          <p className="text-2xl font-bold">{stats.currentStreak}</p>
          <p className="text-xs text-muted-foreground">
            Recorde: {stats.longestStreak}
          </p>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-muted-foreground">Resumos</span>
          </div>
          <p className="text-2xl font-bold">{stats.itemsRead}</p>
        </div>
      </div>

      {/* Badges */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5" />
          Conquistas ({badges.length})
        </h3>
        {badges.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Continue estudando para desbloquear conquistas!
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {badges.map(({ badge }) => (
              <div
                key={badge.id}
                className="border rounded-lg p-3 text-center hover:border-primary/50 transition-colors"
              >
                <div className="text-3xl mb-2">{badge.icon}</div>
                <h4 className={`text-sm font-semibold ${getRarityColor(badge.rarity)}`}>
                  {badge.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {badge.description}
                </p>
                {badge.points > 0 && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    +{badge.points} pts
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Atividade Recente
        </h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma atividade ainda
          </p>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 10).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <span className="text-sm">{formatReason(transaction.reason)}</span>
                <span className="text-sm font-semibold text-green-600">
                  +{transaction.points} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
