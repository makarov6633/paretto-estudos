"use client";

import { useSession } from "@/lib/auth-client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Calendar,
  Shield,
  ArrowLeft,
  CreditCard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createCheckoutSession, openBillingPortal } from "@/app/plans/actions";
import AmbientBackground from "@/components/AmbientBackground";
import PageHero from "@/components/PageHero";

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [plan, setPlan] = useState<{
    plan: "premium" | "free" | "guest";
    currentPeriodEnd?: string | null;
  }>({ plan: "guest" });

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/account/status", { cache: "no-store" });
        const j = await r.json();
        setPlan({ plan: j.plan, currentPeriodEnd: j.currentPeriodEnd || null });
      } catch {}
    })();
  }, []);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        Carregando...
      </div>
    );
  }

  if (!session) {
    router.push("/");
    return null;
  }

  const user = session.user;
  const createdDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("pt-BR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
  const firstName =
    user.name?.split(" ")[0] ?? user.email?.split("@")[0] ?? "Leitor";
  const planLabelMap = {
    premium: "Premium",
    free: "Gratis",
    guest: "Visitante",
  } as const;
  const planLabel = planLabelMap[plan.plan];
  const planUntil = plan.currentPeriodEnd
    ? new Date(plan.currentPeriodEnd).toLocaleDateString("pt-BR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
  const isPremium = plan.plan === "premium";
  const heroStats = [
    {
      label: "Plano atual",
      value: planLabel,
      helper:
        plan.plan === "premium"
          ? planUntil
            ? `Ate ${planUntil}`
            : "Acesso completo ativo"
          : plan.plan === "free"
            ? "5 resumos gratis por mes"
            : "Ative seu primeiro plano",
    },
    {
      label: "Conta desde",
      value: createdDate ?? "-",
      helper: createdDate
        ? "Sua jornada com a Paretto"
        : "Conta criada recentemente",
    },
    {
      label: "Status do email",
      value: user.emailVerified ? "Verificado" : "Pendente",
      helper: user.emailVerified
        ? "Tudo pronto para continuar"
        : "Confirme para desbloquear recursos",
    },
  ];
  const panelClassName =
    "surface-card border-border bg-[color:var(--overlay-card)] backdrop-blur-xl";
  const supportEmail = "suporte@paretto.app";

  return (
    <main className="page-shell">
      <div className="absolute inset-0 -z-30 bg-gradient-to-b from-[color:var(--overlay-strong)] via-[color:var(--overlay-soft)] to-[color:var(--overlay-strong)]" />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,rgba(42,199,105,0.18),transparent_70%)]" />
      <AmbientBackground className="opacity-80" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-16 sm:px-6 lg:px-8">
        <PageHero
          eyebrow="Painel pessoal"
          title={`Bem-vindo${firstName ? `, ${firstName}` : ""}`}
          description="Tudo sobre sua conta Paretto em um so lugar. Ajuste preferencias, confira seu plano e acompanhe sua jornada."
          actions={
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="gap-2 text-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button
                variant={isPremium ? "outline" : "default"}
                size="sm"
                onClick={() => router.push("/plans")}
                className="gap-2"
              >
                <CreditCard className="h-4 w-4" />
                {isPremium ? "Gerenciar assinatura" : "Ver planos"}
              </Button>
            </>
          }
          stats={heroStats}
        />

                  <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Identidade e acesso</h2>
              <p className="text-sm text-muted-foreground">
                Revise seus dados pessoais e garanta que a verificacao esteja em dia.
              </p>
            </div>
            <Card className={`${panelClassName} overflow-hidden`}>
              <CardHeader className="relative border-none pb-0">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 ring-2 ring-white/15">
                      <AvatarImage
                        src={user.image || ""}
                        alt={user.name || "Usuario"}
                        referrerPolicy="no-referrer"
                      />
                      <AvatarFallback className="text-lg">
                        {(user.name?.[0] || user.email?.[0] || "U").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold text-foreground">
                        {user.name || firstName}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                        {user.emailVerified ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                          >
                            <Shield className="mr-1 h-3 w-3" />
                            Verificado
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <Badge className="rounded-full border-border bg-[color:var(--overlay-soft)] px-4 py-2 text-foreground">
                    Plano {planLabel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-[color:var(--overlay-card)] p-4">
                  <Calendar className="h-4 w-4 text-emerald-300" />
                  <div>
                    <p className="text-sm font-medium text-foreground/90">
                      {createdDate ? `Membro desde ${createdDate}` : "Conta ativa"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {createdDate
                        ? "Obrigado por fazer parte da comunidade"
                        : "Sua conta foi criada recentemente"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-[color:var(--overlay-card)] p-4">
                  <Shield className="h-4 w-4 text-emerald-300" />
                  <div>
                    <p className="text-sm font-medium text-foreground/90">
                      {user.emailVerified ? "Email verificado" : "Verificacao pendente"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.emailVerified
                        ? "Protecao extra ativa para sua conta"
                        : "Confirme seu endereco para liberar tudo"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Assinatura e faturamento</h2>
              <p className="text-sm text-muted-foreground">
                Ajuste renovacao, pagamentos e beneficios premium a qualquer momento.
              </p>
            </div>
            <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
              <Card className={`${panelClassName} overflow-hidden`}>
                <CardHeader className="relative border-none pb-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/15 via-transparent to-transparent" />
                  <div className="relative space-y-2">
                    <CardTitle className="text-xl font-semibold text-foreground">
                      Detalhes do plano
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {isPremium
                        ? "Seu acesso premium esta ativo. Ajuste renovacoes quando precisar."
                        : "Assine para liberar audio ilimitado, PDFs e sincronizacao completa."}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 space-y-6 pt-6">
                  <div className="rounded-2xl border border-border bg-[color:var(--overlay-card)] p-4 text-sm text-muted-foreground">
                    Plano atual: <span className="font-semibold text-foreground">{planLabel}</span>
                    {isPremium && planUntil ? (
                      <span className="block text-xs text-muted-foreground">
                        Renovacao em {planUntil}
                      </span>
                    ) : null}
                  </div>
                  <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-[color:var(--overlay-card)] p-4">
                      Acesso ilimitado a resumos, PDFs e audios premium.
                    </div>
                    <div className="rounded-2xl border border-border bg-[color:var(--overlay-card)] p-4">
                      Cancelamento em um clique, sem taxas extras.
                    </div>
                  </div>
                  {isPremium ? (
                    <div className="flex flex-col gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                      {planUntil ? (
                        <p className="text-sm text-foreground">
                          Vigente ate {planUntil}
                        </p>
                      ) : null}
                      <form action={openBillingPortal}>
                        <Button size="lg" className="w-full sm:w-auto">
                          Gerenciar assinatura
                        </Button>
                      </form>
                      <p className="text-xs text-emerald-200/80">
                        Atualize pagamento, consulte recibos e ajuste renovacoes.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-[color:var(--overlay-card)] p-4">
                      <form action={createCheckoutSession}>
                        <Button size="lg" className="w-full sm:w-auto">
                          Assinar por R$ 15/mes
                        </Button>
                      </form>
                      <p className="text-xs text-muted-foreground">
                        Experimente sem risco. Cancelamento rapido direto no portal.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className={panelClassName}>
                <CardHeader>
                  <CardTitle className="text-base text-foreground">
                    Resumo rapido
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Principais referencias da sua assinatura atual.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl border border-border bg-[color:var(--overlay-card)] px-3 py-2">
                      <span className="text-muted-foreground">Plano</span>
                      <span className="font-medium text-foreground">{planLabel}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border bg-[color:var(--overlay-card)] px-3 py-2">
                      <span className="text-muted-foreground">Renovacao</span>
                      <span className="font-medium text-foreground">
                        {isPremium ? planUntil ?? "Renovacao automatica" : "Quando assinar"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border bg-[color:var(--overlay-card)] px-3 py-2">
                      <span className="text-muted-foreground">Portal de billing</span>
                      <span className="font-medium text-foreground">
                        {isPremium ? "Disponivel" : "Indisponivel"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Precisa de ajuda com faturamento? Escreva para {supportEmail} e responderemos em ate 2 dias uteis.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

      </div>
    </main>
  );
}
