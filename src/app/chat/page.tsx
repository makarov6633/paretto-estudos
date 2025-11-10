"use client";

import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/components/auth/user-profile";
import { useSession } from "@/lib/auth-client";
import AmbientBackground from "@/components/AmbientBackground";
import PageHero from "@/components/PageHero";
import { Card, CardContent } from "@/components/ui/card";

const H1: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = (props) => (
  <h1 className="mt-2 mb-3 text-2xl font-bold" {...props} />
);
const H2: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = (props) => (
  <h2 className="mt-2 mb-2 text-xl font-semibold" {...props} />
);
const H3: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = (props) => (
  <h3 className="mt-2 mb-2 text-lg font-semibold" {...props} />
);
const Paragraph: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = (
  props,
) => <p className="mb-3 leading-7 text-sm" {...props} />;
const UL: React.FC<React.HTMLAttributes<HTMLUListElement>> = (props) => (
  <ul className="mb-3 ml-5 list-disc space-y-1 text-sm" {...props} />
);
const OL: React.FC<React.OlHTMLAttributes<HTMLOListElement>> = (props) => (
  <ol className="mb-3 ml-5 list-decimal space-y-1 text-sm" {...props} />
);
const LI: React.FC<React.LiHTMLAttributes<HTMLLIElement>> = (props) => (
  <li className="leading-6" {...props} />
);
const Anchor: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>> = (
  props,
) => (
  <a
    className="underline underline-offset-2 text-primary hover:opacity-90"
    target="_blank"
    rel="noreferrer noopener"
    {...props}
  />
);
const Blockquote: React.FC<React.BlockquoteHTMLAttributes<HTMLElement>> = (
  props,
) => (
  <blockquote
    className="mb-3 border-l-2 border-border pl-3 text-muted-foreground"
    {...props}
  />
);
const Code: Components["code"] = ({ children, className, ...props }) => {
  const match = /language-(\w+)/.exec(className || "");
  const isInline = !match;

  if (isInline) {
    return (
      <code className="rounded bg-muted px-1 py-0.5 text-xs" {...props}>
        {children}
      </code>
    );
  }
  return (
    <pre className="mb-3 w-full overflow-x-auto rounded-md bg-muted p-3">
      <code className="text-xs leading-5" {...props}>
        {children}
      </code>
    </pre>
  );
};
const HR: React.FC<React.HTMLAttributes<HTMLHRElement>> = (props) => (
  <hr className="my-4 border-border" {...props} />
);
const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = (
  props,
) => (
  <div className="mb-3 overflow-x-auto">
    <table className="w-full border-collapse text-sm" {...props} />
  </div>
);
const TH: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = (props) => (
  <th
    className="border border-border bg-muted px-2 py-1 text-left"
    {...props}
  />
);
const TD: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = (props) => (
  <td className="border border-border px-2 py-1" {...props} />
);

const markdownComponents: Components = {
  h1: H1,
  h2: H2,
  h3: H3,
  p: Paragraph,
  ul: UL,
  ol: OL,
  li: LI,
  a: Anchor,
  blockquote: Blockquote,
  code: Code,
  hr: HR,
  table: Table,
  th: TH,
  td: TD,
};

type TextPart = { type?: string; text?: string };
type MaybePartsMessage = {
  display?: ReactNode;
  parts?: TextPart[];
  content?: TextPart[];
};

function renderMessageContent(message: MaybePartsMessage): ReactNode {
  if (message.display) return message.display;
  const parts = Array.isArray(message.parts)
    ? message.parts
    : Array.isArray(message.content)
      ? message.content
      : [];
  return parts.map((p, idx) =>
    p?.type === "text" && p.text ? (
      <ReactMarkdown key={idx} components={markdownComponents}>
        {p.text}
      </ReactMarkdown>
    ) : null,
  );
}

export default function ChatPage() {
  const { data: session, isPending } = useSession();
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");

  if (isPending) {
    return (
      <main className="page-shell">
        <div className="absolute inset-0 -z-30 bg-gradient-to-b from-[color:var(--overlay-strong)] via-[color:var(--overlay-soft)] to-[color:var(--overlay-strong)]" />
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,rgba(42,199,105,0.18),transparent_70%)]" />
        <AmbientBackground className="opacity-80" />
        <div className="relative mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4">
          <Card className="surface-card border-border bg-[color:var(--overlay-card)] backdrop-blur-xl w-full">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Carregando chat...
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="page-shell">
        <div className="absolute inset-0 -z-30 bg-gradient-to-b from-[color:var(--overlay-strong)] via-[color:var(--overlay-soft)] to-[color:var(--overlay-strong)]" />
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,rgba(42,199,105,0.18),transparent_70%)]" />
        <AmbientBackground className="opacity-80" />
        <div className="relative mx-auto w-full max-w-4xl px-4 pb-16 pt-16 sm:px-6 lg:px-8">
          <PageHero
            eyebrow="Assistente"
            title="Entre para conversar com o copiloto Paretto"
            description="Autentique-se para receber resumos comentados, planos de estudo e respostas em contexto com o seu historico."
            stats={[
              { label: "Modo", value: "Premium", helper: "Disponivel para assinantes" },
              { label: "Contexto", value: "Biblioteca", helper: "Referencias em tempo real" },
              { label: "Idiomas", value: "PT-BR", helper: "Foco em conteudo local" },
            ]}
          />
          <section className="mt-10">
            <Card className="surface-card border-border bg-[color:var(--overlay-card)] backdrop-blur-xl">
              <CardContent className="py-8">
                <UserProfile />
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="absolute inset-0 -z-30 bg-gradient-to-b from-[color:var(--overlay-strong)] via-[color:var(--overlay-soft)] to-[color:var(--overlay-strong)]" />
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,rgba(42,199,105,0.18),transparent_70%)]" />
      <AmbientBackground className="opacity-80" />
      <div className="relative mx-auto w-full max-w-5xl px-4 pb-16 pt-16 sm:px-6 lg:px-8">
        <PageHero
          eyebrow="Assistente"
          title="Converse com o copiloto inspirado nos resumos Paretto"
          description="Peça roteiros de estudo, revise ideias chaves ou explore conceitos. A conversa considera seus resumos recentes." 
          stats={[
            { label: "Status", value: status === "streaming" ? "Respondendo" : "Pronto", helper: "Atualiza em tempo real" },
            { label: "Mensagens", value: `${messages.length}`, helper: "Historico local na sessao" },
            { label: "Privacidade", value: "Somente voce", helper: "Dados nao sao usados para treino" },
          ]}
          actions={
            <Button
              asChild
              size="sm"
              variant="outline"
              className="rounded-full border-border bg-[color:var(--overlay-soft)] text-foreground hover:bg-[color:var(--overlay-card)]"
            >
              <a href="/library">Voltar para biblioteca</a>
            </Button>
          }
        />

        <section className="mt-10">
          <Card className="surface-card border-border bg-[color:var(--overlay-card)] backdrop-blur-xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                <div className="max-h-[60vh] min-h-[320px] overflow-y-auto space-y-4 pr-1">
                  {messages.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-[color:var(--overlay-card)] px-4 py-6 text-center text-sm text-muted-foreground">
                      Comece perguntando sobre um resumo ou solicite um plano de estudo personalizado.
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`max-w-full rounded-2xl border border-border px-4 py-3 text-sm shadow-sm sm:max-w-[80%] ${
                          message.role === "user"
                            ? "ml-auto bg-emerald-500/10 text-emerald-100"
                            : "bg-[color:var(--overlay-card)] text-foreground"
                        }`}
                      >
                        <div className="mb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          {message.role === "user" ? "Voce" : "AI"}
                        </div>
                        <div className="leading-relaxed">
                          {renderMessageContent(message as MaybePartsMessage)}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const text = input.trim();
                    if (!text) return;
                    sendMessage({ role: "user", parts: [{ type: "text", text }] });
                    setInput("");
                  }}
                  className="flex flex-col gap-3 sm:flex-row"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escreva sua pergunta ou pedido"
                    className="flex-1 rounded-full border border-border bg-[color:var(--overlay-card)] px-4 py-3 text-sm text-foreground placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || status === "streaming"}
                    className="rounded-full px-6"
                  >
                    Enviar
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

