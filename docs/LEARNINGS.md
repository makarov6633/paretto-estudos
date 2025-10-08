--- Origem: .cursor/rules/project-rules.mdc ---

---
alwaysApply: true
---

- Sempre rode os scripts `lint` e `typecheck` após concluir mudanças (`npm run lint` e `npm run typecheck`).
- NUNCA inicie o dev server você mesmo. Se precisar de algo do terminal, peça ao usuário.

- UI/UX Visual (moderno e profissional):
  - Design tokens: use apenas variáveis do tema definidas em `src/app/globals.css` (`--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--ring`, `--radius`, `--shadow-*`). Não hardcode cores/hex.
  - Tailwind v4: use utilitários para layout/estilo; evite CSS customizado ou inline. Preferir classes utilitárias e padrões do projeto.
  - Componentes: basear em shadcn/ui em `src/components/ui/*` e variantes com `cva`. Reutilize `surface-card`, `surface-popover`, `shadow-elevated`, `cover-card`, `vignette` quando aplicável.
  - Dark mode: validar claro/escuro (usa `next-themes`). Manter contraste de texto/ícones e anéis de foco adequados em ambos.
  - Tipografia: usar `.heading` para títulos; respeitar tamanhos (`h1..h4`) e `leading`/`tracking` consistentes. Para truncar, use `line-clamp-*`.
  - Layout & espaçamento: mobile-first. Usar `grid/flex` com `gap-*`, `container mx-auto` e `max-w-*`. Espaçamento consistente (escala 2/4/6/8/12/16).
  - Motion: transições sutis (`transition`, `duration-200/300`, `ease-out`) e respeitar `prefers-reduced-motion`. Animações utilitárias existentes (`floaty`, `marquee`) apenas quando fizer sentido.
  - Acessibilidade: WCAG AA+, foco visível (`ring`), navegação por teclado, semântica correta e ARIA onde necessário. Botões somente ícone precisam de `aria-label`.
  - Revisão: conferir responsividade (sm/md/lg/xl), contraste, dark mode, uso de tokens, e efeitos visuais não intrusivos. Evitar regressões visuais.
  - Dependências: não adicionar novas libs para estilização. Usar Tailwind/shadcn já presentes.

\n--- Origem: .claude/commands/fix-build-issues.md ---

We are trying to clear out the many lint and typecheck issues in the project.
Please use the lint and typecheck scripts to resolve all issues.
Do not introduce any lint of type issues with your changes. For example, DO NOT use type any!

For database schema interfaces, I believe drizzle has a built in function for inferring the types.
Think harder. Ensure you don't introduce new type and lint errors with your changes.
