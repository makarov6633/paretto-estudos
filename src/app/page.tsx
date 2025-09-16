"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Headphones, BookOpen, Clock, Trophy } from "lucide-react";
import Image from "next/image";
import { useSession, signIn } from "@/lib/auth-client";

export default function Home() {
  const { data: session, isPending } = useSession();

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs md:text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Aprenda 95% do conteúdo em 20% do tempo
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Paretto Estudos
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            O 20% que gera 95% dos resultados. Resumos imersivos e audiobooks
            narrados por IA treinada para extrair o essencial — leia, ouça e
            avance de onde parou.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {session ? (
              <Button asChild size="lg">
                <Link href="/dashboard">Ver catálogo gratuito</Link>
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={async () => {
                  await signIn.social({ provider: "google", callbackURL: "/dashboard" });
                }}
              >
                Começar grátis
              </Button>
            )}
            <Button asChild variant="outline" size="lg">
              <Link href="#como-funciona">Como funciona</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="container mx-auto px-4 pb-16 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="p-6 rounded-xl border bg-card text-card-foreground">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">20% mais importante</h3>
            <p className="text-sm text-muted-foreground">
              Curadoria com IA para priorizar as ideias que geram 95% do
              aprendizado.
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-card text-card-foreground">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">Leitura imersiva</h3>
            <p className="text-sm text-muted-foreground">
              Experiência estilo Kindle com destaque, notas e progresso
              sincronizado.
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-card text-card-foreground">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Headphones className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">Audiobooks poderosos</h3>
            <p className="text-sm text-muted-foreground">
              Velocidade, pitch e vozes otimizadas. Leia + ouça no plano pago.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits band (inspired by your reference) */}
      <section className="container mx-auto px-4 pb-12 md:pb-20">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">Se você ama livros, você vai amar o Paretto</h2>
          <p className="text-muted-foreground text-lg">
            Crie sua conta para começar a ler e ouvir onde e quando quiser.
          </p>
        </div>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 mt-10">
          <div className="text-center space-y-3">
            <div className="relative mx-auto w-full max-w-[360px] aspect-[16/9]">
              <Image src="/illustrations/cook.svg" alt="Escuta transforma o dia" fill priority className="object-contain" />
            </div>
            <h3 className="text-xl font-semibold">Descubra como a escuta pode transformar o seu dia</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Mergulhe em uma nova história enquanto realiza suas tarefas diárias.
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="relative mx-auto w-full max-w-[360px] aspect-[16/9]">
              <Image src="/illustrations/walk.svg" alt="Biblioteca com você" fill className="object-contain" />
            </div>
            <h3 className="text-xl font-semibold">Carregue uma biblioteca com você o tempo todo</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Leve seus resumos e audiobooks para onde for, sem peso na bolsa.
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="relative mx-auto w-full max-w-[360px] aspect-[16/9]">
              <Image src="/illustrations/celebrate.svg" alt="Metas de leitura" fill className="object-contain" />
            </div>
            <h3 className="text-xl font-semibold">Alcance suas metas de leitura</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Leia quando der e ouça em trânsito. Avance 95% em 20% do tempo.
            </p>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="container mx-auto px-4 pb-20">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold">Como funciona</h2>
            <ol className="space-y-3 text-muted-foreground">
              <li>1. Escolha um título do catálogo moderno por tema.</li>
              <li>2. Leia o resumo essencial com destaques guiados por IA.</li>
              <li>3. Ative o audiobook e alterne para Leitura + Áudio no plano pago.</li>
              <li>4. Prossiga de onde parou em qualquer dispositivo.</li>
            </ol>
            <div className="pt-2 flex gap-3">
              {session ? (
                <Button asChild>
                  <Link href="/dashboard">Explorar agora</Link>
                </Button>
              ) : (
                <Button
                  onClick={async () => {
                    await signIn.social({ provider: "google", callbackURL: "/dashboard" });
                  }}
                >
                  Criar conta grátis
                </Button>
              )}
              <Button asChild variant="ghost">
                <Link href="/library">Ver catálogo</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-xl border p-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg bg-muted p-4">Catálogo curado</div>
              <div className="rounded-lg bg-muted p-4">Busca por temas</div>
              <div className="rounded-lg bg-muted p-4">Modo imersivo</div>
              <div className="rounded-lg bg-muted p-4">Player avançado</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
