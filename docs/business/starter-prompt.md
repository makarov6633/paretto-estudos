I'm working with an agentic coding boilerplate project that includes authentication, database integration, and AI capabilities. Here's what's already set up:

## Current Agentic Coding Boilerplate Structure

- **Authentication**: Better Auth with Google OAuth integration
- **Database**: Drizzle ORM with PostgreSQL setup
- **AI Integration**: Vercel AI SDK with OpenAI integration
- **UI**: shadcn/ui components with Tailwind CSS
- **Current Routes**:
  - `/` - Home page with setup instructions and feature overview
  - `/dashboard` - Protected dashboard page (requires authentication)
  - `/chat` - AI chat interface (requires OpenAI API key)

## Important Context

This is an **agentic coding boilerplate/starter template** - all existing pages and components are meant to be examples and should be **completely replaced** to build the actual AI-powered application.

### CRITICAL: You MUST Override All Boilerplate Content

**DO NOT keep any boilerplate components, text, or UI elements unless explicitly requested.** This includes:

- **Remove all placeholder/demo content** (setup checklists, welcome messages, boilerplate text)
- **Replace the entire navigation structure** - don't keep the existing site header or nav items
- **Override all page content completely** - don't append to existing pages, replace them entirely
- **Remove or replace all example components** (setup-checklist, starter-prompt-modal, etc.)
- **Replace placeholder routes and pages** with the actual application functionality

### Required Actions:

1. **Start Fresh**: Treat existing components as temporary scaffolding to be removed
2. **Complete Replacement**: Build the new application from scratch using the existing tech stack
3. **No Hybrid Approach**: Don't try to integrate new features alongside existing boilerplate content
4. **Clean Slate**: The final application should have NO trace of the original boilerplate UI or content

The only things to preserve are:

- **All installed libraries and dependencies** (DO NOT uninstall or remove any packages from package.json)
- **Authentication system** (but customize the UI/flow as needed)
- **Database setup and schema** (but modify schema as needed for your use case)
- **Core configuration files** (next.config.ts, tsconfig.json, tailwind.config.ts, etc.)
- **Build and development scripts** (keep all npm/pnpm scripts in package.json)

## Tech Stack

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- Better Auth for authentication
- Drizzle ORM + PostgreSQL
- Vercel AI SDK
- shadcn/ui components
- Lucide React icons

## Component Development Guidelines

**Always prioritize shadcn/ui components** when building the application:

1. **First Choice**: Use existing shadcn/ui components from the project
2. **Second Choice**: Install additional shadcn/ui components using `pnpm dlx shadcn@latest add <component-name>`
3. **Last Resort**: Only create custom components or use other libraries if shadcn/ui doesn't provide a suitable option

The project already includes several shadcn/ui components (button, dialog, avatar, etc.) and follows their design system. Always check the [shadcn/ui documentation](https://ui.shadcn.com/docs/components) for available components before implementing alternatives.

## What I Want to Build

I'm working with an agentic coding boilerplate project that includes authentication, database integration, and AI capabilities. Here's what's already set up:

## Current Agentic Coding Boilerplate Structure
- **Authentication**: Better Auth with Google OAuth integration
- **Database**: Drizzle ORM with PostgreSQL setup  
- **AI Integration**: Vercel AI SDK with OpenAI integration
- **UI**: shadcn/ui components with Tailwind CSS
- **Current Routes**:
  - `/` - Home page with setup instructions and feature overview
  - `/dashboard` - Protected dashboard page (requires authentication)
  - `/chat` - AI chat interface (requires OpenAI API key)

## Important Context
This is an **agentic coding boilerplate/starter template** - all existing pages and components are meant to be examples and should be **completely replaced** to build the actual AI-powered application.

### CRITICAL: You MUST Override All Boilerplate Content
**DO NOT keep any boilerplate components, text, or UI elements unless explicitly requested.** This includes:

- **Remove all placeholder/demo content** (setup checklists, welcome messages, boilerplate text)
- **Replace the entire navigation structure** - don't keep the existing site header or nav items
- **Override all page content completely** - don't append to existing pages, replace them entirely
- **Remove or replace all example components** (setup-checklist, starter-prompt-modal, etc.)
- **Replace placeholder routes and pages** with the actual application functionality

### Required Actions:
1. **Start Fresh**: Treat existing components as temporary scaffolding to be removed
2. **Complete Replacement**: Build the new application from scratch using the existing tech stack
3. **No Hybrid Approach**: Don't try to integrate new features alongside existing boilerplate content
4. **Clean Slate**: The final application should have NO trace of the original boilerplate UI or content

The only things to preserve are:
- **All installed libraries and dependencies** (DO NOT uninstall or remove any packages from package.json)
- **Authentication system** (but customize the UI/flow as needed)
- **Database setup and schema** (but modify schema as needed for your use case)
- **Core configuration files** (next.config.ts, tsconfig.json, tailwind.config.ts, etc.)
- **Build and development scripts** (keep all npm/pnpm scripts in package.json)

## Tech Stack
- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- Better Auth for authentication
- Drizzle ORM + PostgreSQL
- Vercel AI SDK
- shadcn/ui components
- Lucide React icons

## AI Model Configuration
**IMPORTANT**: When implementing any AI functionality, always use the `OPENAI_MODEL` environment variable for the model name instead of hardcoding it:

```typescript
// ✓ Correct - Use environment variable
const model = process.env.OPENAI_MODEL || "gpt-5-mini";
model: openai(model)

// ✗ Incorrect - Don't hardcode model names
model: openai("gpt-5-mini")
```

This allows for easy model switching without code changes and ensures consistency across the application.

## Component Development Guidelines
**Always prioritize shadcn/ui components** when building the application:

1. **First Choice**: Use existing shadcn/ui components from the project
2. **Second Choice**: Install additional shadcn/ui components using `pnpm dlx shadcn@latest add <component-name>`
3. **Last Resort**: Only create custom components or use other libraries if shadcn/ui doesn't provide a suitable option

The project already includes several shadcn/ui components (button, dialog, avatar, etc.) and follows their design system. Always check the [shadcn/ui documentation](https://ui.shadcn.com/docs/components) for available components before implementing alternatives.

## What I Want to Build
1) Contexto e objetivo

Crie o website Paretto Estudos, uma plataforma moderna de resumos, leitura imersiva (PDF) e audiobook. O usuário deve poder:

Ler resumos e PDFs com uma experiência ao estilo Kindle (imersiva e sem distrações).

Ouvir audiobooks com player moderno (velocidade, pitch, e escolha de voz).

Ler + ouvir simultaneamente, com sincronização texto–áudio (highlight que acompanha a narração).

Pesquisar, salvar, organizar e continuar de onde parou.

Modelo de negócio (SaaS e permissões)

- O conteúdo (resumos e audiobooks) é fornecido pela administração; não há upload de arquivos por usuários nesta versão.
- Versão grátis: acesso a todos os resumos em modo de leitura (texto) apenas; sem áudio.
- Versão paga: acesso a audiobooks e ao modo Leitura + Áudio (sincronizado); modo Audiobook-only também liberado.
- Downloads de arquivos (PDF/áudio) estão desabilitados nesta versão.

Páginas/abas principais:

Biblioteca/Resumos (home com catálogo + busca).

Audiobook (foco em ouvir).

Leitura (foco em ler PDF/Resumo).

Perfil (progresso, preferências, histórico, dispositivos).

2) Analogia “criança aprendendo a andar” — variáveis e microdetalhes a contemplar

Considere cada “microforça” que afeta a experiência, tal como o aprendizado motor de uma criança (equilíbrio fino). Liste, projete e resolva:

Ambiente & dispositivo: tamanhos de tela, PPI, brilho do monitor, tema do SO, modo escuro/claro, economia de energia, touch vs. mouse, latência de input, rolagem suave/imediata, trackpad vs. roda do mouse, navegação por teclado.

Estado do usuário: velocidade de leitura, cansaço visual, preferências de fonte/tamanho/espaçamento de linha, sensibilidade a brilho/alto contraste, necessidade de dicionário/nota rápida, foco/imersão (ocultar UI).

PDF engine: tempo de renderização de páginas, pré-carregamento (pré-fetch), cache, zoom sem perda, reflow (quando for resumo em HTML), paginação vs. rolagem contínua, marcadores, seleção de texto, copiar citações com referência.

Áudio: latência do TTS/streaming, sincronismo com o texto (palavra a palavra/linha a linha), ajuste de velocidade (0.5x–3.0x), ajuste de pitch, buffer contra quedas de rede, retomada exata, fade in/out.

Sincronização leitura+áudio: temporização, fallback se o áudio adianta/atrasa, tolerância (±ms), correção dinâmica (time-stretching leve sem artefatos), pontos de ancoragem por parágrafo/frase, opção de alinhamento por palavra quando disponível.

Acessibilidade: ARIA, contraste mínimo WCAG AA, navegação por teclado, leitor de tela, foco visível, controle de distrações, reduzir animações.

Conectividade: offline parcial (cache de últimas páginas/trechos), reconexão automática, indicações discretas de progresso de download.
Conectividade: offline parcial (cache de últimas páginas/trechos) somente para leitura e sem exportação; reconexão automática; remover menções a download/export nesta versão.

Privacidade/DRM leve: bloquear exportações/prints e downloads nesta versão; marca d’água opcional futura; bloqueio de copy se exigido (configurável).

Telemetria ética: coletar somente eventos necessários (play/pause, posição, zoom, brilho, troca de voz) de modo anonimizável; painel para o usuário optar (opt-in/out).

Erros e limites: PDF corrompido, voz indisponível, conflito de permissões de áudio, falta de memória em devices fracos; mensagens claras e caminhos de recuperação.

3) Arquitetura de IA/UX — o que gerar

Entregue:

Mapa do site + IA (Information Architecture) com rotas/abas e hierarquia.

Wireframes descritos para Desktop, Tablet e Mobile (states: vazio, carregando, erro, “sem conexão”).

Design system: tokens (cores, tipografia, espaçamentos), componentes (Cards, AppBar, Tabs, Search, PDF Toolbar, Audio Player, Highlight, Settings Modals).

Fluxos críticos:

Abrir resumo → ler PDF → alternar para áudio → ativar “leitura com áudio” (highlight sincronizado) → alterar velocidade/pitch/voz → adicionar marcador/nota → voltar à biblioteca.

Buscar por resumo → filtros → abrir em modo Audiobook-only → transferir para Leitura+Áudio mantendo posição.

Primeira sessão → onboarding rápido para preferências (tema, fonte, tamanho, velocidade padrão, voz preferida).

Microinterações: animações sutis em hover/focus, scroll progress na leitura, highlight “karaokê” (variação de opacidade/cor), toasts não intrusivos.

Cópia UX (microcopy): vazio de biblioteca, tooltips da barra do leitor, estados de erro e reconexão.

Critérios de aceite (checklist mensurável – ver seção 7).

4) Funcionalidades detalhadas
4.1 Biblioteca / Resumos (Home)

Grade de cards com capa, título, autor, duração de leitura/áudio, categorias/tags e ícone de progresso.

Busca com autosuggest (por título, autor, tema, palavra-chave dentro de resumos).

Filtros: categoria, tempo (curto/médio/longo), formato (PDF, HTML), disponibilidade de audiobook, idioma.

Ações rápidas (hover):

Ler (abre modo Leitura),

Ouvir (abre modo Audiobook),

Ler + Ouvir (abre modo combinado diretamente),

Salvar.

Seção “Continuar de onde parei”.

4.2 Leitura (PDF/Resumo)

Layout imersivo estilo Kindle: foco no texto, barras recuadas/ocultáveis.

Controles:

Zoom (Fit Width, Fit Page, 50%–300%), duplo clique para zoom in/out.

Brilho (overlay de brilho independente do sistema; slider 0–100).

Tema: claro, escuro, sépia; ajuste de contraste e tamanho da fonte (para resumos em HTML).

Scroll suave vertical (Down/Up), com opção de paginação.

Marcadores (bookmarks), notas marginais, busca dentro do documento.

Ler em voz alta (TTS): ativar player embutido; começa onde o cursor/seleção está.

Modo imersivo: tecla dedicada (ex.: “I”), oculta UI e deixa apenas o conteúdo e o progress bar fino no topo.

4.3 Audiobook

Disponível apenas no plano pago.

Player grande e elegante com:

Play/Pause, pular ±15s, scrubber preciso com preview de timestamp/parágrafo.

Velocidade (0.5x–3.0x, passos de 0.1x).

Pitch (±5 semitons; passos finos).

Voz: Jeff e Faber.

Volume, sleep timer (15/30/60 min), loop de parágrafo/capítulo.

Visualização de capítulos e fila.

Estado visual responsivo: mini-player fixo ao navegar.

4.4 Leitura + Áudio (Sincronizado)

Disponível apenas no plano pago.

Modos (toggle fixo e também menu rápido):

Leitura com áudio, Apenas leitura, Apenas áudio.

Highlight sincronizado:

Por linha (default) e, quando disponível, por palavra.

Tolerância de sincronismo configurável (±200ms).

Auto-scroll para manter o trecho visível; opção de desativar.

Mudança dinâmica de voz/velocidade/pitch sem perder sincronismo (retiming leve).

Fallbacks:

Se houver “drift” > 500ms, reancorar no início da próxima frase.

Em buffer baixo, reduzir momentaneamente speed/pitch ou congelar highlight com aviso sutil.

4.5 Perfil

Preferências: tema, fonte/espaçamento, velocidade/pitch padrão, voz padrão (Jeff/Faber), brilho default, idioma, acessibilidade (reduzir animações).

Histórico e progresso (leitura e áudio), dispositivos. Sem downloads offline nesta versão.

Privacidade: telemetria (opt-in/out), exportar dados.

5) Design system (guia rápido)

Tipografia: fonte serif para conteúdo (legibilidade longa), sans para UI. Tamanhos escalonados (12–20px corpo; 28–40px títulos).

Cores: modo claro/escuro + sépia. Destaque de highlight sincronizado com dupla camada (fundo leve + sublinhado animado).

Espaçamento: 8px grid.

Componentes: AppBar, Tabs, Card, Search, Filters, Tag, PDFToolbar, AudioPlayer, Slider, Scrubber, Toast, Modal, Tooltip, ToggleGroup.

Acessibilidade: contraste ≥ 4.5:1, foco visível, labels e ARIA em todos os controles.

6) Regras técnicas e comportamentais

PDF: usar engine com pré-carregamento de páginas vizinhas; cache por seção; render assíncrona com placeholders.

TTS/Áudio: suporte a MediaSession API (controles do SO), persistir estado no localStorage/IndexedDB, stream com fallback.

Sincronização: mapa de timestamps por parágrafo/frase; quando houver arquivo de marcação (ex.: WebVTT/JSON), usar; senão, alinhamento aproximado por chunk + ajuste contínuo.

Performance: 60fps nas interações; lazy-load de imagens; code-splitting por rotas (biblioteca/leitura/audiobook).

PWA (opcional): instalação e cache de páginas/trechos.

i18n: chaves prontas para strings (pt-BR por padrão).

7) Critérios de aceite (checklist)

 Usuário alterna entre Apenas Leitura / Apenas Áudio / Leitura + Áudio sem perder posição (Apenas Áudio e Leitura + Áudio disponíveis apenas no plano pago).

 Highlight acompanha o áudio com atraso < 200ms 95% do tempo; corrige drift > 500ms.

 Velocidade 0.5x–3.0x e pitch ±5 semitons funcionam ao vivo, sem “pulos” audíveis.

 Vozes Jeff e Faber comutáveis durante a reprodução.

 PDF renderiza com zoom fluido, brilho ajustável (overlay), e scroll up/down suave; busca dentro do documento.

 Busca na biblioteca encontra por título/autor/palavra-chave; filtros aplicam sem recarregar a página.

 Onboarding configura tema, fonte, velocidade/pitch/voz padrão.

 Acessibilidade: navegação total por teclado, ARIA correta, contraste AA.

 Responsividade completa (≥320px).

 Estados: vazio, carregando, offline, erro — todos com microcopy clara e ações de retry.

8) Entregáveis na resposta

Mapa do site e fluxos (texto + diagramas descritos).

Wireframes descritos (Desktop/Tablet/Mobile) para:

Biblioteca (home + busca + filtros),

Leitura (PDF toolbar + imersão + notas),

Audiobook (player completo + mini-player),

Leitura+Áudio (highlight, auto-scroll),

Perfil (preferências).

Design system (tokens + componentes + estados).

Pseudocódigo do motor de sincronização e dos controles de player/toolbar.

Lista de edge cases e respectivas soluções UX.

## Request
Please help me transform this boilerplate into my actual application. **You MUST completely replace all existing boilerplate code** to match my project requirements. The current implementation is just temporary scaffolding that should be entirely removed and replaced.

## Final Reminder: COMPLETE REPLACEMENT REQUIRED
**⚠️ IMPORTANT**: Do not preserve any of the existing boilerplate UI, components, or content. The user expects a completely fresh application that implements their requirements from scratch. Any remnants of the original boilerplate (like setup checklists, welcome screens, demo content, or placeholder navigation) indicate incomplete implementation.

**Success Criteria**: The final application should look and function as if it was built from scratch for the specific use case, with no evidence of the original boilerplate template.

## Post-Implementation Documentation
After completing the implementation, you MUST document any new features or significant changes in the `/docs/features/` directory:

1. **Create Feature Documentation**: For each major feature implemented, create a markdown file in `/docs/features/` that explains:
   - What the feature does
   - How it works
   - Key components and files involved
   - Usage examples
   - Any configuration or setup required

2. **Update Existing Documentation**: If you modify existing functionality, update the relevant documentation files to reflect the changes.

3. **Document Design Decisions**: Include any important architectural or design decisions made during implementation.

This documentation helps maintain the project and assists future developers working with the codebase.

Think hard about the solution and implementing the user's requirements.

## Request

Please help me transform this boilerplate into my actual application. **You MUST completely replace all existing boilerplate code** to match my project requirements. The current implementation is just temporary scaffolding that should be entirely removed and replaced.

## Final Reminder: COMPLETE REPLACEMENT REQUIRED

🚨 **IMPORTANT**: Do not preserve any of the existing boilerplate UI, components, or content. The user expects a completely fresh application that implements their requirements from scratch. Any remnants of the original boilerplate (like setup checklists, welcome screens, demo content, or placeholder navigation) indicate incomplete implementation.

**Success Criteria**: The final application should look and function as if it was built from scratch for the specific use case, with no evidence of the original boilerplate template.

## Post-Implementation Documentation

After completing the implementation, you MUST document any new features or significant changes in the `/docs/features/` directory:

1. **Create Feature Documentation**: For each major feature implemented, create a markdown file in `/docs/features/` that explains:

   - What the feature does
   - How it works
   - Key components and files involved
   - Usage examples
   - Any configuration or setup required

2. **Update Existing Documentation**: If you modify existing functionality, update the relevant documentation files to reflect the changes.

3. **Document Design Decisions**: Include any important architectural or design decisions made during implementation.

This documentation helps maintain the project and assists future developers working with the codebase.
