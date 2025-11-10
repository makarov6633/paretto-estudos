import { ProgressDashboard } from "@/components/gamification/progress-dashboard";

export default function ProfilePage() {
  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Meu Progresso</h1>
        <p className="text-muted-foreground mt-2">
          Acompanhe seu desempenho e conquistas
        </p>
      </div>

      <ProgressDashboard />
    </div>
  );
}
