"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { ItemCard } from "@/components/ItemCard";
import type { Item } from "@/types";
import {
  CheckCircle2,
  FileText,
  GripHorizontal,
  MapPin,
  Globe2,
  GraduationCap,
  BarChart3,
  Rows,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const [recItems, setRecItems] = useState<Item[]>([]);
  const [recLoading, setRecLoading] = useState(true);
  const [now, setNow] = useState("--:--:--");
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [featureImage, setFeatureImage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const url = session?.user?.id
          ? `/api/recommendations?userId=${encodeURIComponent(session.user.id)}&limit=8`
          : `/api/items?limit=8`;
        const r = await fetch(url, { cache: "no-store" });
        const j = await r.json();
        setRecItems(Array.isArray(j.items) ? j.items : []);
      } catch {
        setRecItems([]);
      } finally {
        setRecLoading(false);
      }
    };
    load();
  }, [session?.user?.id]);

  useEffect(() => {
    const envHero = process.env.NEXT_PUBLIC_HERO_IMAGE_URL;
    setBgImage(
      envHero && envHero.length > 0
        ? envHero
        : "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=1920&auto=format&fit=crop",
    );
  }, []);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      setNow(`${hh}:${mm}:${ss}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const envFeature = process.env.NEXT_PUBLIC_FEATURE_IMAGE_URL;
    setFeatureImage(
      envFeature && envFeature.length > 0
        ? envFeature
        : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1600&auto=format&fit=crop",
    );
  }, []);

  return (
    <main className="page-shell antialiased">
      <div className="fixed inset-0 -z-20">
        {bgImage ? (
          <Image
            src={bgImage}
            alt="Textura de água sutil fixa"
            fill
            sizes="100vw"
            className="object-cover opacity-[0.18]"
            priority
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/50 to-background/70" />
      </div>

      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 opacity-[0.35] bg-[radial-gradient(#101010_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute inset-0 opacity-[0.22] bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:120px_1px,1px_120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-transparent to-background/80" />
      </div>

      <header className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs sm:text-sm tracking-tight text-muted-foreground">
              LOCAL <span className="tabular-nums">{now}</span>
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
            <GripHorizontal className="w-4 h-4" />
          </div>
          {/* contato removido conforme solicitação */}
        </div>
      </header>

      <section id="hero" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative mt-10 sm:mt-16">
          <h1 className="leading-none tracking-tight text-white select-none">
            <span className="block text-[22vw] md:text-[16vw] xl:text-[12vw] 2xl:text-[10vw] font-extrabold">
              <span className="text-shadow-hero">PARETTO</span>
            </span>
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Resumos originais e fiéis: preservamos as ideias e a estrutura do
            autor, com linguagem clara e exemplos práticos. No mínimo 20% da
            extensão para garantir profundidade e compreensão real.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Link
              href="/requests"
              className="no-underline inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium tracking-tight text-white bg-emerald-500/90 hover:bg-emerald-500"
            >
              Pedir resumo 20/95
            </Link>
            <Link
              href="/library"
              className="no-underline inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium tracking-tight text-foreground bg-[color:var(--overlay-card)] transition-colors hover:bg-[color:var(--overlay-soft)]"
            >
              Ver catálogo
            </Link>
          </div>
        </div>

        <div className="mt-6 sm:mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="pt-5">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-emerald-400 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground mt-1">Sudeste · GMT</p>
                <p className="text-sm font-medium text-foreground/90 tracking-tight">
                  Base em Rio de Janeiro, Brasil
                </p>
              </div>
            </div>
          </div>
          <div className="pt-5">
            <div className="flex items-start gap-3">
              <Globe2 className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium tracking-tight text-foreground/90">
                  Colaboração Global
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Projetos remotos · Worldwide
                </p>
              </div>
            </div>
          </div>
          <div className="pt-5">
            <div className="flex items-start gap-3">
              <GraduationCap className="w-5 h-5 text-indigo-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium tracking-tight text-foreground/90">
                  Resumos Profissionais 2095
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  20% do tamanho · 95% do conteúdo
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 sm:mt-14">
          <div className="relative overflow-hidden rounded-2xl bg-[color:var(--overlay-card)]">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/30 via-transparent to-transparent mix-blend-screen pointer-events-none" />
            {featureImage ? (
              <Image
                src={featureImage}
                alt="Sistema de resumos com IA"
                width={1600}
                height={900}
                className="w-full h-[52vh] sm:h-[60vh] object-cover"
              />
            ) : (
              <div className="w-full h-[52vh] sm:h-[60vh] bg-gradient-to-br from-neutral-800 to-neutral-700" />
            )}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-14 sm:mt-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl tracking-tight font-semibold text-white">
            Recursos do Sistema
          </h2>
          <Link
            href="#"
            className="no-underline text-sm text-muted-foreground hover:text-white inline-flex items-center gap-2"
          >
            <span>Ver todos</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <article className="group rounded-xl overflow-hidden bg-[color:var(--overlay-card)] hover:bg-[color:var(--overlay-soft)] transition">
            <div className="relative aspect-[16/10]">
              <Image
                src="https://images.unsplash.com/photo-1517148815978-75f6acaaf32c?q=80&w=1200&auto=format&fit=crop"
                alt="Resumo essencial"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BarChart3 className="w-4 h-4" />
                <span>20/95</span>
              </div>
              <h3 className="mt-2 text-base font-semibold tracking-tight text-white">
                Resumo Essencial
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                95% do conteúdo preservado em 20% do tamanho. Clareza, foco e
                impacto.
              </p>
            </div>
          </article>
          <article className="group rounded-xl overflow-hidden bg-[color:var(--overlay-card)] hover:bg-[color:var(--overlay-soft)] transition">
            <div className="relative aspect-[16/10]">
              <Image
                src="https://images.unsplash.com/photo-1621619856624-42fd193a0661?w=1080&q=80"
                alt="Leitura com IA"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Rows className="w-4 h-4" />
                <span>IA</span>
              </div>
              <h3 className="mt-2 text-base font-semibold tracking-tight text-white">
                Leitura com IA
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Compreensão semântica profunda para capturar ideias‑chave e
                contexto.
              </p>
            </div>
          </article>
          <article className="group rounded-xl overflow-hidden bg-[color:var(--overlay-card)] hover:bg-[color:var(--overlay-soft)] transition">
            <div className="relative aspect-[16/10]">
              <Image
                src="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=1080&q=80"
                alt="Revisão e Memória"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                <span>Aprendizado</span>
              </div>
              <h3 className="mt-2 text-base font-semibold tracking-tight text-white">
                Revisão e Memória
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Pontos de ação, checklists e quiz de retenção para fixação
                rápida.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section id="catalogo" className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-semibold">
            Recomendados para você
          </h2>
          <Link
            className="no-underline text-sm text-muted-foreground hover:text-white"
            href="/library"
            onClick={(e) => {
              e.preventDefault();
              router.push("/library");
            }}
          >
            Ver todos
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {recLoading && (
            <div className="text-sm text-muted-foreground">Carregando…</div>
          )}
          {!recLoading &&
            recItems.map((it) => <ItemCard key={it.id} item={it as Item} />)}
        </div>
      </section>

      <section
        id="services"
        className="max-w-7xl mx-auto px-4 sm:px-6 mt-14 sm:mt-20"
      >
        <div className="overflow-hidden bg-[color:var(--overlay-card)] rounded-2xl">
          <div className="flex items-end justify-between p-6 border-b border-border">
            <h2 className="text-2xl sm:text-3xl tracking-tight font-semibold text-white">
              Serviços
            </h2>
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="#"
                className="no-underline inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium tracking-tight text-white bg-[color:var(--overlay-soft)] hover:bg-white/20"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Apresentação</span>
              </Link>
            </div>
          </div>

          <div className="p-6 sm:p-8 border-b border-border">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-1">
                <div className="text-3xl sm:text-4xl font-medium tracking-tight text-white/70 tabular-nums">
                  1
                </div>
              </div>
              <div className="md:col-span-8">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-400" />{" "}
                    Leitura e compreensão semântica com IA
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-400" />{" "}
                    Extração de ideias‑chave e evidências
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-400" />{" "}
                    Síntese 2095: 20% do tamanho, 95% do conteúdo
                  </li>
                </ul>
                <div className="mt-4 flex items-center gap-3">
                  <div className="aspect-[4/3] w-24 sm:w-28 rounded-md overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop"
                      alt="Leitura inteligente"
                      width={320}
                      height={240}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="aspect-[4/3] w-24 sm:w-28 rounded-md overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1635151227785-429f420c6b9d?w=1080&q=80"
                      alt="Ideias-chave"
                      width={320}
                      height={240}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="aspect-[4/3] w-24 sm:w-28 rounded-md overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1557800636-894a64c1696f?q=80&w=800&auto=format&fit=crop"
                      alt="Síntese objetiva"
                      width={320}
                      height={240}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
              <div className="md:col-span-3 md:text-right">
                <h3 className="text-lg sm:text-xl tracking-tight font-semibold text-white">
                  Resumo Inteligente
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  IA + Síntese profissional
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 border-b border-border">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-1">
                <div className="text-3xl sm:text-4xl font-medium tracking-tight text-white/70 tabular-nums">
                  2
                </div>
              </div>
              <div className="md:col-span-8">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-400" />{" "}
                    Preservação de fontes e referências
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-400" />{" "}
                    Checagem de consistência e fatos
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-400" />{" "}
                    Indicadores de aprendizado e pontos de ação
                  </li>
                </ul>
                <div className="mt-4 flex items-center gap-3">
                  <div className="aspect-[16/10] w-28 sm:w-32 rounded-md overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1621619856624-42fd193a0661?w=1080&q=80"
                      alt="Análise e verificação"
                      width={320}
                      height={200}
                      className="w-full h-full object-cover grayscale"
                    />
                  </div>
                  <div className="aspect-[16/10] w-28 sm:w-32 rounded-md overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop"
                      alt="Qualidade e consistência"
                      width={320}
                      height={200}
                      className="w-full h-full object-cover grayscale"
                    />
                  </div>
                </div>
              </div>
              <div className="md:col-span-3 md:text-right">
                <h3 className="text-lg sm:text-xl tracking-tight font-semibold text-white">
                  Qualidade e Foco
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Precisão e confiança
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-1">
                <div className="text-3xl sm:text-4xl font-medium tracking-tight text-white/70 tabular-nums">
                  3
                </div>
              </div>
              <div className="md:col-span-8">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-400" />{" "}
                    Formato enxuto e pronto para ação
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-400" />{" "}
                    Explicações progressivas e glossário
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-400" />{" "}
                    Quiz de retenção e checklist final
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-400" />{" "}
                    Exportação (PDF/Markdown) e integrações
                  </li>
                </ul>
                <div className="mt-4 flex items-center gap-3">
                  <div className="aspect-[16/10] w-32 sm:w-40 rounded-md overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=1080&q=80"
                      alt="Formato enxuto"
                      width={360}
                      height={220}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="aspect-[16/10] w-32 sm:w-40 rounded-md overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop"
                      alt="Entrega e integrações"
                      width={360}
                      height={220}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
              <div className="md:col-span-3 md:text-right">
                <h3 className="text-lg sm:text-XL tracking-tight font-semibold text-white">
                  Entrega e Experiência
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Aprendizado garantido
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Envie seu texto e receba um resumo 2095 pronto para aplicar.
            </p>
            {/* CTAs "Agendar conversa" e "Solicitar orçamento" removidos */}
          </div>
        </div>
      </section>

      <section id="direitos-autorais" className="max-w-7xl mx-auto px-4 pb-16">
        <div className="mt-10 space-y-4">
          <h2 className="text-xl font-semibold">Direitos autorais</h2>
          <div className="text-sm text-muted-foreground space-y-3 max-w-3xl">
            <p>
              Não somos responsáveis por nenhum arquivo aqui encontrado.
              Buscamos na internet por conteúdos liberados e aqui
              compartilhamos.
            </p>
            <p>
              Caso você encontre algum material de sua autoria aqui, entre em
              contato; solicitaremos os documentos que comprovem seus direitos
              sobre tal material e removeremos imediatamente.
            </p>
            <p>
              Nosso prazo é de até 5 dias úteis para resposta da solicitação.
              Lembre‑se de que somente o detentor dos direitos autorais ou seu
              representante autorizado pode enviar uma denúncia de violação de
              direitos autorais. Se você acredita que algo infringe os direitos
              autorais de alguém, pode ser interessante informar o detentor
              desses direitos.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
