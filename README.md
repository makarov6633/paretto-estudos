# Paretto Estudos — Aplicação Web

Aplicação web com autenticação, biblioteca de resumos (leitura/PDF/áudio), integração com Stripe (assinatura mensal), UI com shadcn/ui e otimizações de performance, qualidade e mobile.

Tecnologias: Next.js 15 (App Router), React 19, TypeScript, Tailwind, shadcn/ui, Drizzle ORM, Stripe.

## Como rodar

1) Instale dependências
```
pnpm install
```
2) Desenvolvimento
```
pnpm dev
```
3) Build/produção
```
pnpm build && pnpm start
```

## Variáveis de ambiente (.env)

Mínimo para dev:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```
Para banco/Stripe/Google:
```
POSTGRES_URL=postgres://user:pass@host:5432/db
BETTER_AUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Pagamentos (Stripe)

- Checkout de assinatura mensal (R$ 15) — `src/app/plans/actions.ts`
- Webhook — `src/app/api/stripe/webhook/route.ts`
- Portal de cobrança — `openBillingPortal()`

Dev com Stripe CLI:
```
stripe login
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

## Qualidade de código

- Lint/Types: `pnpm run lint`, `pnpm run typecheck`
- Qlty (código): `.tools/qlty/qlty.exe check --no-upgrade-check --summary src scripts examples`
- Gitleaks (segredos): `.tools/qlty/qlty.exe check --no-upgrade-check --summary --filter gitleaks src scripts examples`

Observação: arquivos temporários de Qlty não são versionados. Mantemos apenas documentação do projeto.

## Mobile

- Viewport configurado (`src/app/layout.tsx`)
- Navegação com prefetch e botão Voltar com fallback
- Library otimizada (carrega primeiro lote) e rotas com cache
- Imagens otimizadas e fallback de capas

Próximos ajustes sugeridos: skeletons em listas, menu mobile dedicado, leitura de sessão no servidor (sem round‑trip).

## Segurança

- Headers e CSP (`next.config.ts`)
- Rate limit (`src/middleware.ts`)
- Gate premium/free (`src/app/api/access/check/route.ts`)

## Suporte

Abra issues com:
- Passos para reproduzir
- Trechos de logs relevantes
- Ambiente (dev/prod, SO, Node/pnpm)

## Sincronização real de áudio e texto

Para sincronização profissional (sem fallback/mock), utilize o alinhamento palavra a palavra com WhisperX e grave no banco em `sync_map`.

Pré‑requisitos
- Defina `POSTGRES_URL` no `.env`.
- Tenha `ffmpeg` instalado no sistema.
- Python 3.10+ com pacotes: `torch`, `torchaudio`, `whisperx`, `psycopg2-binary`.
- GPU NVIDIA opcional (recomendado). CPU funciona, porém mais lento.

Instalação (exemplo)
```
pip install --upgrade pip
pip install psycopg2-binary
# Escolha a variante do Torch adequada (CPU/CUDA). Exemplo CPU:
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install -U whisperx
```

Gerar mapas de sincronização reais
```
pnpm run sync:align
```

O script `scripts/align_word_sync.py`:
- Transcreve e alinha o áudio em pt‑BR com WhisperX.
- Persiste em `sync_map` com `granularity = "word"` e pontos `{ t: ms, i: seção, w: índiceDaPalavra }`.
- A UI do leitor (página `src/app/item/[slug]/read/page.tsx`) usa esses dados para destacar palavras e exibir capítulos com tempos exatos.

Observação: se o áudio divergir do texto das seções, o alinhamento de palavras permanece preciso; para melhorar a associação palavra→seção, podemos aplicar matching fuzzy por cabeçalhos/trechos.
