Quality Audit — Agentic Coding Starter Kit

Summary

- Goal: surface dead/duplicate code and propose small, low‑risk simplifications to keep the project easy to understand.
- No files deleted. Changes are documented and opt‑in for removal later.

Dead/Unused Code Candidates

- src/components/starter-prompt-modal.tsx: Not imported anywhere.
- src/components/setup-checklist.tsx: Not imported anywhere.
- src/hooks/use-diagnostics.ts: Only referenced by the unused checklist; otherwise unused.
- src/components/ui/github-stars.tsx: No imports found.
- src/components/ui/dialog.tsx: Only imported by starter-prompt-modal (unused).

Notes: These are safe to remove or move to an examples/ folder. Keeping for now.

Duplications/Overlaps

- Image sources: There are two image listing flows:
  - API: src/app/api/images/route.ts and src/app/api/covers/route.ts
  - Client util: src/lib/list-public-images.ts (calls /api/images)
    This is acceptable; however /api/images should accept the dir query param used by fetchPublicImages. This was fixed.

Small Fixes Applied

- Tailwind utility ‘heading’ caused build error. Fixed by adding the class to utilities layer and inlining heading font-family for h1–h4. (src/app/globals.css)
- Ensure PostCSS plugin loads across environments by adding postcss.config.js (the existing .mjs kept).
- Align /api/images with fetchPublicImages by handling ?dir= param (see Changes section below).

Potential Simplifications (Optional — propose to apply on request)

- Remove unused components/hooks listed above.
- Add a short “Architecture Overview” to README linking main modules (auth, db, items, recommendations, images).
- Normalize diacritics in texts (several strings show mojibake from encoding) when convenient.

Main Flows (for orientation)

- App shell: src/app/layout.tsx, src/app/globals.css
- Landing/catalog: src/app/page.tsx, src/components/ItemCard.tsx
- Library: src/app/library/page.tsx
- Reader: src/app/item/[slug]/read/page.tsx (+ API: items, telemetry)
- Auth: src/app/api/auth/[...all]/route.ts -> src/lib/auth.ts -> src/lib/db.ts
- DB Schema: src/lib/schema.ts
- APIs: items, recommendations, images, covers, item/pdf, telemetry

Changes

- src/app/api/images/route.ts now accepts a safe ‘dir’ query param, enabling src/lib/list-public-images.ts to request subfolders.

Validation

- Lint and typecheck pass after changes. No runtime assumptions added.
## TODO — Sincronização WhisperX (manual, sem mock)

Contexto: Remover qualquer fallback/mock e garantir sincronização real por item. Corrigir casos um a um.

Tarefas
- Verificar reader crash ao montar `sectionWords` quando `sync_map.data.i` referencia seção fora do intervalo.
  - Status: corrigido no código (ignora índices fora do range).
- Conferir, por slug, se `summary_section` e `sync_map` têm o mesmo particionamento lógico.
  - Seções sem texto ou títulos genéricos podem deslocar o mapeamento; ajustar conteúdo/ordem conforme o áudio real.
- Validar capítulos/tempos na UI em `/item/{slug}/read` (Capítulos e Pular intro).
  - Confirmar que tempos levam ao início do capítulo correto.
- Remover o uso de mapas aproximados.
  - Não executar `scripts/generate-sync-maps.mjs` em produção.
  - Manter apenas `scripts/align_word_sync.py` (WhisperX) para geração real.

Slugs com sync gerado (amostra)
- gestalt-terapia-fundamentos-reorganizado — 7.5k pontos (word)
- a-sutil-arte-resumo-dissertativo — 12.6k (word)
- martin-heidegger-psicologia-existencial-resumo-padronizado — 4.4k (word)
- cem-anos-solidao-resumo-95-por-cento-final — 19k (word)
- freud-fundamentos-clinica-reestruturado — 10.5k (word)
- 1984 — 18.6k (word)
- plantas-medicinais-viva-mais-e-melhor — 4.3k (word)
- a-psicologia-da-mulher-maravilha-need-manus — 22k (word)
- freud-interpretacao-sonhos-final — 12.5k (word)
- talvez-voce-deva-conversar-com-alguem-resumo-profissional-expandido — 20k (word)

Procedimento de QA por item
1) Abrir `/item/{slug}/read`.
2) Reproduzir 30–60s; validar destaque de palavras e rolagem por seção.
3) Abrir “Capítulos”; testar 3 saltos e conferir tempos.
4) Se desalinhado:
   - Comparar `summary_section` vs áudio (primeiras frases de cada seção).
   - Ajustar `contentHtml`/ordem da seção para casar com o áudio, ou regenerar o sync do item.
5) Registrar resultado: OK / Ajustado / Regerado.

Observações
- Ambiente Windows/CPU: WhisperX configurado com `compute_type=int8`.
- Se o LCP estiver alto, confirmar que o leitor não está iniciando em segundo plano e que o PDF (se habilitado) não está bloqueando o thread principal.
