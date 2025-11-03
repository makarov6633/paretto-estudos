"use client";

import { useEffect, useState } from "react";
import AmbientBackground from "@/components/AmbientBackground";
import PageHero from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";

type Req = {
  id: string;
  title: string;
  author?: string | null;
  sourceUrl?: string | null;
  notes?: string | null;
  status: string;
};

export default function RequestsPage() {
  const { data: session } = useSession();
  const [existing, setExisting] = useState<Req | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/requests", { cache: "no-store" });
      if (res.ok) {
        const j = await res.json();
        setExisting(j.request ?? null);
      } else if (res.status === 401) {
        setExisting(null);
      }
    } catch {
      setExisting(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [session?.user?.id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author: author || undefined,
          sourceUrl: sourceUrl || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const j: unknown = await res.json().catch(() => ({}));
        const err = (j as { error?: string })?.error ?? `Erro ${res.status}`;
        setError(err);
      } else {
        setTitle("");
        setAuthor("");
        setSourceUrl("");
        setNotes("");
        await refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <div className="absolute inset-0 -z-30 bg-gradient-to-b from-[color:var(--overlay-strong)] via-[color:var(--overlay-soft)] to-[color:var(--overlay-strong)]" />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,rgba(42,199,105,0.18),transparent_70%)]" />
      <AmbientBackground className="opacity-80" />
      <div className="relative mx-auto w-full max-w-4xl px-4 pb-16 pt-16 sm:px-6 lg:px-8">
        <PageHero
          eyebrow="Solicitacoes"
          title="Peca o proximo resumo que quer ver no Paretto"
          description="Envie detalhes do livro ou artigo que precisa. Cada pedido ajuda a priorizar a fila de novos conteudos para toda a comunidade."
          stats={[
            {
              label: "Resposta",
              value: "3 a 5 dias",
              helper: "Retorno por email ou na plataforma",
            },
            {
              label: "Status atual",
              value: existing ? existing.status : "Aguardando",
              helper: existing ? "Pedido em analise" : "Nenhum pedido ativo",
            },
            {
              label: "Limite",
              value: "1 ativo",
              helper: "Envie outro apos finalizar",
            },
          ]}
        />

        <section className="mt-10 space-y-6">
          {!session?.user ? (
            <Card className="surface-card border-border bg-[color:var(--overlay-card)] backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Faca login para solicitar</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Entre com sua conta antes de registrar um novo pedido.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-6">
              {loading ? (
                <Card className="surface-card border-border bg-[color:var(--overlay-card)] backdrop-blur-xl">
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    Carregando pedidos...
                  </CardContent>
                </Card>
              ) : existing ? (
                <Card className="surface-card border-border bg-[color:var(--overlay-card)] backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-base text-foreground">Pedido pendente</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Aguarde nossa equipe concluir esta analise antes de enviar outro pedido.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-foreground">
                    <div>
                      <span className="text-muted-foreground">Titulo:</span>
                      <span className="ml-1 font-medium">{existing.title}</span>
                    </div>
                    {existing.author ? (
                      <div>
                        <span className="text-muted-foreground">Autor:</span>
                        <span className="ml-1">{existing.author}</span>
                      </div>
                    ) : null}
                    {existing.sourceUrl ? (
                      <div>
                        <span className="text-muted-foreground">Fonte:</span>
                        <a
                          className="ml-1 underline hover:opacity-90"
                          href={existing.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          link
                        </a>
                      </div>
                    ) : null}
                    {existing.notes ? (
                      <div>
                        <span className="text-muted-foreground">Notas:</span>
                        <span className="ml-1">{existing.notes}</span>
                      </div>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      Voce podera enviar outro pedido quando este for concluido.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="surface-card border-border bg-[color:var(--overlay-card)] backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-base text-foreground">Enviar novo pedido</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Preencha com o maximo de detalhes para acelerar a producao do resumo.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                      <div>
                        <label className="block text-sm mb-1" htmlFor="request-title">
                          Titulo do livro ou artigo
                        </label>
                        <input
                          id="request-title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full rounded-xl border border-border bg-[color:var(--overlay-card)] px-3 py-2 text-sm text-foreground placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                          required
                          minLength={3}
                          maxLength={200}
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1" htmlFor="request-author">
                          Autor (opcional)
                        </label>
                        <input
                          id="request-author"
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          className="w-full rounded-xl border border-border bg-[color:var(--overlay-card)] px-3 py-2 text-sm text-foreground placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                          maxLength={200}
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1" htmlFor="request-source">
                          Fonte ou URL (opcional)
                        </label>
                        <input
                          id="request-source"
                          type="url"
                          value={sourceUrl}
                          onChange={(e) => setSourceUrl(e.target.value)}
                          className="w-full rounded-xl border border-border bg-[color:var(--overlay-card)] px-3 py-2 text-sm text-foreground placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                          maxLength={1000}
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1" htmlFor="request-notes">
                          Observacoes (opcional)
                        </label>
                        <textarea
                          id="request-notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full rounded-xl border border-border bg-[color:var(--overlay-card)] px-3 py-2 text-sm text-foreground placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                          rows={4}
                          maxLength={1000}
                        />
                      </div>
                      {error ? (
                        <div className="text-sm text-destructive">{String(error)}</div>
                      ) : null}
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="rounded-full"
                      >
                        {submitting ? "Enviando" : "Enviar pedido"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              <Card className="surface-card border-border bg-[color:var(--overlay-card)] backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-base text-foreground">Como priorizamos</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Entenda como os pedidos entram na fila editorial.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    1. Avaliamos relevancia para a comunidade e disponibilidade de fontes confiaveis.
                  </p>
                  <p>
                    2. Se aceito, o pedido segue para roteiro, producao de conteudo e revisao.
                  </p>
                  <p>
                    3. Avisamos assim que o resumo entra no catalogo e liberamos notificacao para voce.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
