"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardChartsProps {
  studyByDay: Array<{ date: string; minutes: number }>;
  categoriesRead: Array<{ category: string; count: number }>;
  weeklyGoal?: number;
}

const COLORS = ["#6366f1", "#8b5cf6", "#d946ef", "#f43f5e", "#f59e0b", "#10b981"];

export function DashboardCharts({
  studyByDay,
  categoriesRead,
  weeklyGoal = 180,
}: DashboardChartsProps) {
  const formattedStudyData = studyByDay.map((day) => ({
    ...day,
    label: format(new Date(day.date), "EEE", { locale: ptBR }),
    fullDate: format(new Date(day.date), "dd/MM", { locale: ptBR }),
  }));

  const totalWeekMinutes = studyByDay.reduce((sum, day) => sum + day.minutes, 0);
  const goalProgress = Math.min(100, (totalWeekMinutes / weeklyGoal) * 100);

  const categoryData = categoriesRead.slice(0, 6).map((cat, idx) => ({
    ...cat,
    fill: COLORS[idx % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Study Time Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Tempo de Estudo Semanal</h3>
            <p className="text-sm text-muted-foreground">
              Meta: {weeklyGoal} min/semana
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{totalWeekMinutes} min</p>
            <p className="text-sm text-muted-foreground">
              {goalProgress.toFixed(0)}% da meta
            </p>
          </div>
        </div>

        {/* Goal Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-secondary/20 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                goalProgress >= 100
                  ? "bg-emerald-500"
                  : goalProgress >= 70
                  ? "bg-primary"
                  : "bg-orange-500"
              }`}
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={formattedStudyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
            <XAxis
              dataKey="label"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              label={{
                value: "Minutos",
                angle: -90,
                position: "insideLeft",
                style: { fill: "hsl(var(--muted-foreground))" },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Bar
              dataKey="minutes"
              fill="hsl(var(--primary))"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category Distribution */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            Distribuição por Categoria
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                label
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Progresso Diário</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={formattedStudyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
              <XAxis
                dataKey="label"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
              <Line
                type="monotone"
                dataKey="minutes"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
