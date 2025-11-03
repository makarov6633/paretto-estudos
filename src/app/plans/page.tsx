import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createCheckoutSession, openBillingPortal } from "./actions";
import { headers } from "next/headers";
import AmbientBackground from "@/components/AmbientBackground";
import PageHero from "@/components/PageHero";
import { CheckCircle2, Shield, Sparkles } from "lucide-react";

export default async function PlansPage() {
  let premium = false;
  let until: string | null = null;
  try {
    const hdrs = await headers();
    const origin =
      process.env.NEXT_PUBLIC_BASE_URL ||
      `${hdrs.get("x-forwarded-proto") ?? "http"}://${hdrs.get("x-forwarded-host") ?? hdrs.get("host")}`;
    const res = await fetch(`${origin}/api/account/status`, {
      headers: { Cookie: hdrs.get("cookie") || "" },
      cache: "no-store",
    });
    if (res.ok) {
      const j = await res.json();
      if (j.plan === "premium") {
        premium = true;
        until = j.currentPeriodEnd || null;
      }
    }
  } catch {}

  const untilDisplay = until
    ? new Date(until).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const heroStats = [
    {
      label: "Status atual",
      value: premium ? "Premium ativo" : "Plano gratuito",
      helper: premium
        ? "Acesso completo liberado"
        : "5 resumos gratis por mes incluidos",
    },
    {
      label: "Proximo ciclo",
      value: untilDisplay ?? "-",
      helper: premium
        ? "Renovacao automatica via Stripe"
        : "Assine para liberar renovacao",
    },
    {
      label: "Portal de billing",
      value: premium ? "Disponivel" : "Indisponivel",
      helper: premium
        ? "Gerencie pagamentos e recibos"
        : "Acesso liberado apos assinatura",
    },
  ];

  const panelClassName =
    "surface-card border-border bg-[color:var(--overlay-card)] backdrop-blur-xl";

  return (
    <main className="page-shell">
      <div className="absolute inset-0 -z-30 bg-gradient-to-b from-[color:var(--overlay-strong)] via-[color:var(--overlay-soft)] to-[color:var(--overlay-strong)]" />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,rgba(42,199,105,0.18),transparent_70%)]" />
      <AmbientBackground className="opacity-80" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-16 sm:px-6 lg:px-8">
        <PageHero
          eyebrow="Planos e assinatura"
          title="Construa um ritmo de leitura sob medida"
          description="Escolha o plano que combina com seu momento. Assine quando quiser, com billing seguro via Stripe."
          actions={
            <>
              {premium ? (
                <form action={openBillingPortal} className="inline-flex">
                  <Button size="sm" className="gap-2">
                    <Shield className="h-4 w-4" />
                    Abrir portal de cobranca
                  </Button>
                </form>
              ) : (
                <form action={createCheckoutSession} className="inline-flex">
                  <Button size="sm" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Assinar por R$ 15/mes
                  </Button>
                </form>
              )}
              <Link href="/library" className="inline-flex">
                <Button variant="outline" size="sm" className="gap-2">
                  Explorar catalogo
                </Button>
              </Link>
            </>
          }
          stats={heroStats}
        />

        <section className="relative z-10 mt-12 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Comparativo de planos</h2>
            <p className="text-sm text-muted-foreground">
              Entenda rapidamente o que cada modalidade entrega antes de decidir.
            </p>
          </div>
          <div className="grid gap-6 lg:mt-2 lg:grid-cols-[1fr_1.1fr]">
            <Card className={`${panelClassName} overflow-hidden`}>
              <CardHeader className="relative border-none pb-0">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                <div className="relative space-y-2">
                  <CardTitle className="text-xl font-semibold text-foreground">
                    Plano gratuito
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Ideal para conhecer o catalogo e salvar favoritos.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6 text-sm text-muted-foreground">
                <div className="rounded-2xl border border-border bg-[color:var(--overlay-card)] p-4">
                  Teste a experiencia completa com limite mensal generoso.
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                    5 resumos gratuitos por mes com notas e insights.
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                    Leituras em texto, player basico e playlist pessoal.
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                    Mantenha historico e sincronize favoritos entre dispositivos.
                  </li>
                </ul>
                <div className="rounded-2xl border border-border bg-[color:var(--overlay-card)] p-4 text-xs text-muted-foreground">
                  Pronto para dar o proximo passo? Assine quando quiser - sem fidelidade.
                </div>
              </CardContent>
            </Card>

            <Card className={`${panelClassName} overflow-hidden border-emerald-500/20`}>
              <CardHeader className="relative border-none pb-0">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-transparent to-transparent" />
                <div className="relative space-y-2">
                  <CardTitle className="text-2xl sm:text-3xl font-semibold text-foreground">
                    Premium - R$ 15/mês
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Tudo ilimitado, com conteudos completos e integracoes.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-3 sm:gap-4 text-sm text-muted-foreground grid-cols-1 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-[color:var(--overlay-card)] p-4">
                    PDFs completos, audios premium e notas estruturadas.
                  </div>
                  <div className="rounded-2xl border border-border bg-[color:var(--overlay-card)] p-4">
                    Checklists, quiz de retencao e integracao com ferramentas.
                  </div>
                  <div className="rounded-2xl border border-border bg-[color:var(--overlay-card)] p-4">
                    Atualizacoes semanais com novas obras e series exclusivas.
                  </div>
                  <div className="rounded-2xl border border-border bg-[color:var(--overlay-card)] p-4">
                    Cancelamento imediato direto no portal Stripe.
                  </div>
                </div>

                {premium ? (
                  <div className="flex flex-col gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                    {untilDisplay ? (
                      <p className="text-sm text-foreground">
                        Assinatura vigente ate {untilDisplay}
                      </p>
                    ) : null}
                    <form action={openBillingPortal}>
                      <Button size="lg" className="w-full sm:w-auto">
                        Gerenciar assinatura
                      </Button>
                    </form>
                    <p className="text-xs text-emerald-200/80">
                      Atualize pagamento, consulte recibos e desligue a renovacao quando quiser.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 rounded-2xl border border-border bg-[color:var(--overlay-card)] p-4">
                    <form action={createCheckoutSession}>
                      <Button size="lg" className="w-full sm:w-auto">
                        Assinar agora
                      </Button>
                    </form>
                    <p className="text-xs text-muted-foreground">
                      Pagamento seguro via Stripe. Sem taxas ocultas, sem fidelidade.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="relative z-10 mt-12 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Duvidas rapidas</h2>
            <p className="text-sm text-muted-foreground">
              Respostas diretas para as perguntas que mais recebemos sobre o plano.
            </p>
          </div>
          <Card className={`${panelClassName} overflow-hidden`}>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border bg-[color:var(--overlay-card)] p-4">
                <p className="font-semibold text-foreground/90">Posso cancelar quando quiser?</p>
                <p className="mt-2 text-muted-foreground">
                  Sim. O portal Stripe fica disponivel 24/7 para cancelar, pausar ou atualizar o plano imediatamente.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-[color:var(--overlay-card)] p-4">
                <p className="font-semibold text-foreground/90">Ha periodo de teste?</p>
                <p className="mt-2 text-muted-foreground">
                  Use o plano gratuito para testar todos os fluxos. Quando quiser desbloquear tudo, basta assinar.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="relative z-10 mt-12 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Suporte e proximos passos</h2>
            <p className="text-sm text-muted-foreground">
              Continue explorando ou fale com a equipe caso precise de ajuda com o faturamento.
            </p>
          </div>
          <Card className={panelClassName}>
            <CardContent className="flex flex-col gap-4 p-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-foreground">
                  Duvidas sobre cobranca ou nota fiscal?
                </p>
                <p className="text-xs text-muted-foreground">
                  Escreva para suporte@paretto.app e respondemos em ate 2 dias uteis.
                </p>
              </div>
              {premium ? (
                <form action={openBillingPortal}>
                  <Button variant="outline" className="rounded-full border-border">
                    Abrir portal Stripe
                  </Button>
                </form>
              ) : (
                <form action={createCheckoutSession}>
                  <Button className="rounded-full">
                    Assinar agora
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/library" className="inline-flex">
              <Button size="lg" className="gap-2 rounded-[var(--radius-xl)]">
                Explorar catalogo completo
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
