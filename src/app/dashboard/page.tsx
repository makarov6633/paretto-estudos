"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Trophy,
  Flame,
  TrendingUp,
  Award,
  Clock,
  BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardData {
  gamification: {
    totalPoints: number;
    currentStreak: number;
    longestStreak: number;
    level: number;
    quizzesCompleted: number;
    checklistsCompleted: number;
    notesCreated: number;
    itemsRead: number;
  };
  recentBadges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    rarity: string;
    earnedAt: string;
  }>;
  totalStudyTimeMinutes: number;
  categoriesRead: Array<{
    category: string;
    count: number;
  }>;
  studyByDay: Array<{
    date: string;
    minutes: number;
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      router.push("/");
      return;
    }

    const fetchDashboard = async () => {
      try {
        const response = await fetch("/api/dashboard");
        if (response.ok) {
          const dashboardData = await response.json();
          setData(dashboardData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [session, router]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando dashboard...</p>
      </div>
    );
  }

  const maxStudy = Math.max(...data.studyByDay.map((d) => d.minutes), 1);

  return (
    <main className="page-shell">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Meu Painel de Estudos
          </h1>
          <p className="text-muted-foreground">
            Acompanhe seu progresso e conquistas
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-muted-foreground">Sequência</span>
            </div>
            <p className="text-2xl font-bold">{data.gamification.currentStreak}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Recorde: {data.gamification.longestStreak} dias
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Pontos</span>
            </div>
            <p className="text-2xl font-bold">{data.gamification.totalPoints}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Nível {data.gamification.level}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">Lidos</span>
            </div>
            <p className="text-2xl font-bold">{data.gamification.itemsRead}</p>
            <p className="text-xs text-muted-foreground mt-1">resumos</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Tempo</span>
            </div>
            <p className="text-2xl font-bold">{data.totalStudyTimeMinutes}</p>
            <p className="text-xs text-muted-foreground mt-1">minutos (30 dias)</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Últimos 7 dias</h2>
            </div>
            <div className="flex items-end justify-between gap-2 h-48">
              {data.studyByDay.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className="w-full bg-primary rounded-t"
                      style={{
                        height: `${(day.minutes / maxStudy) * 100}%`,
                        minHeight: day.minutes > 0 ? "8px" : "0px",
                      }}
                      title={`${day.minutes} min`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(day.date).toLocaleDateString("pt-BR", {
                      weekday: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Categorias mais lidas</h2>
            </div>
            <div className="space-y-3">
              {data.categoriesRead.slice(0, 5).map((cat, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{cat.category}</span>
                    <span className="text-muted-foreground">{cat.count}</span>
                  </div>
                  <div className="w-full bg-secondary/20 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${(cat.count / data.categoriesRead[0].count) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {data.categoriesRead.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum resumo lido ainda
                </p>
              )}
            </div>
          </div>
        </div>

        {data.recentBadges.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Conquistas Recentes</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {data.recentBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center text-center p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <p className="font-medium text-sm mb-1">{badge.name}</p>
                  <Badge
                    variant="outline"
                    className="text-xs"
                  >
                    {badge.rarity}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
