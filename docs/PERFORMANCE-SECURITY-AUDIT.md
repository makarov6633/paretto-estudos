# Performance & Security Audit - Paretto Estudos

**Data**: 2025-11-17  
**Status**: ✅ jsdom unificado | 🟡 Otimizações pendentes

---

## ✅ CORRIGIDO: Conflito de versões jsdom

### Problema
```
Package jsdom can't be external
The package resolves to a different version when requested from the project directory (25.0.1) 
compared to the package requested from the importing module (27.1.0).
```

### Solução aplicada
1. ✅ **jsdom movido** de `devDependencies` → `dependencies` na versão `27.2.0` (mais recente)
2. ✅ **pnpm.overrides** adicionado para forçar versão única em toda árvore de dependências
3. ✅ **Verificado**: apenas 1 versão do jsdom no projeto

```json
{
  "dependencies": {
    "jsdom": "27.2.0",
    "isomorphic-dompurify": "^2.31.0"
  },
  "pnpm": {
    "overrides": {
      "jsdom": "27.2.0"
    }
  }
}
```

---

## 🚀 PERFORMANCE - Análise e Recomendações

### 1. Backend / API Routes

#### Problema identificado
- **TTFB alto**: 5330ms na primeira requisição para `/item/.../read`
- **Cascata de requests**: múltiplas chamadas API em sequência
  - `/api/items`
  - `/api/similar-items`
  - `/api/progress`
  - `/api/recommendations`

#### Cache atual (BOM ✅)
Já implementado em várias rotas:
```typescript
// /api/items - 3 min cache
"public, s-maxage=180, stale-while-revalidate=60"

// /api/recommendations - 5 min cache
"public, s-maxage=300, stale-while-revalidate=60"
```

#### 🎯 Recomendações

**A. Endpoint agregador** (ALTA PRIORIDADE)
Criar `/api/item-page/[slug]` que retorna tudo de uma vez:
```typescript
// Exemplo de endpoint agregador
export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const [item, similarItems, userProgress] = await Promise.all([
    fetchItem(params.slug),
    fetchSimilarItems(params.slug),
    fetchUserProgress(userId, params.slug),
  ]);
  
  return NextResponse.json({
    item,
    similarItems,
    userProgress,
  }, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=120" }
  });
}
```

**B. Índices de banco de dados**
Verificar índices nas colunas mais consultadas:
```sql
-- Verificar e criar se necessário
CREATE INDEX IF NOT EXISTS idx_items_slug ON item(slug);
CREATE INDEX IF NOT EXISTS idx_reading_event_user_item ON reading_event(user_id, item_id);
CREATE INDEX IF NOT EXISTS idx_summary_section_item ON summary_section(item_id, order_index);
```

**C. React Server Components**
Mover lógica de fetch para Server Components quando possível:
```tsx
// app/item/[slug]/page.tsx (Server Component)
export default async function ItemPage({ params }: { params: { slug: string } }) {
  // Fetch no servidor, paralelo
  const [item, similar] = await Promise.all([
    fetchItem(params.slug),
    fetchSimilar(params.slug),
  ]);
  
  return <ItemView item={item} similar={similar} />;
}
```

**D. ISR (Incremental Static Regeneration)**
Para páginas de item que não mudam frequentemente:
```typescript
// next.config.ts ou fetch options
export const revalidate = 300; // 5 minutos
```

---

### 2. Frontend Optimization

#### Problemas identificados
- ❌ Cliente fazendo múltiplos fetches (`cache: "no-store"`) em Client Components
- ❌ Página inicial (`page.tsx`) é 100% Client Component com `"use client"`

#### 🎯 Recomendações

**A. Reduzir JS no cliente**
```tsx
// ❌ Antes (tudo client-side)
"use client"
export default function Home() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetch('/api/items').then(...)
  }, []);
}

// ✅ Depois (server-first)
export default async function Home() {
  const items = await fetch('/api/items', {
    next: { revalidate: 60 }
  }).then(r => r.json());
  
  return <ClientWrapper items={items} />;
}
```

**B. Dynamic imports para componentes pesados**
```tsx
// Para componentes grandes de UI
const DashboardCharts = dynamic(() => import('@/components/DashboardCharts'), {
  ssr: false,
  loading: () => <Skeleton />
});
```

**C. Otimização de imagens**
✅ Já usando `next/image` - bom!
Verificar se `sizes` está configurado corretamente para economia de banda.

---

## 🔒 SEGURANÇA - Análise e Melhorias

### 1. DOMPurify Configuration

#### Estado atual
**✅ BOM**: Já usando `isomorphic-dompurify` com `jsdom@27.2.0`

**🟡 Pode melhorar**: Configuração inconsistente entre arquivos

**Localização**:
- `/src/app/api/admin/import/route.ts` - sem config (linha 103)
- `/src/app/item/[slug]/read/page.tsx` - com ALLOWED_TAGS (linha 699-704)

#### 🎯 Recomendações

**A. Criar configuração centralizada**
Arquivo: `/src/lib/sanitize.ts`

```typescript
import DOMPurify from "isomorphic-dompurify";

// Configuração padrão segura
const DEFAULT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 
    'ul', 'ol', 'li', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'a', 'span', 'div',
    'table', 'thead', 'tbody', 'tr', 'td', 'th'
  ],
  ALLOWED_ATTR: ['href', 'class', 'id', 'title', 'target', 'rel'],
  ALLOWED_URI_REGEXP: /^https?:\/\//i, // Apenas HTTPS
  KEEP_CONTENT: true,
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'style'], // Bloquear handlers
};

export function sanitizeHtml(dirty: string, config?: DOMPurify.Config): string {
  return DOMPurify.sanitize(dirty, { ...DEFAULT_CONFIG, ...config });
}

// Para uso em imports admin (mais restritivo)
export function sanitizeAdminHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ...DEFAULT_CONFIG,
    ALLOWED_ATTR: ['href', 'class', 'id'], // Sem style
    ADD_TAGS: [], // Não permitir tags customizadas
  });
}
```

**B. Usar em todos os lugares**
```typescript
// admin/import/route.ts
import { sanitizeAdminHtml } from '@/lib/sanitize';

contentHtml: s.contentHtml ? sanitizeAdminHtml(s.contentHtml) : undefined,

// item/[slug]/read/page.tsx
import { sanitizeHtml } from '@/lib/sanitize';

dangerouslySetInnerHTML={{ 
  __html: sanitizeHtml(section.contentHtml || '') 
}}
```

---

### 2. CSP (Content Security Policy)

#### Estado atual
✅ **BOM**: CSP já configurado em `next.config.ts`

```typescript
// Produção
"script-src 'self'"
"default-src 'self'"
"img-src 'self' data: blob: https://..."
```

#### 🎯 Melhorias sugeridas

**A. Adicionar nonces para inline scripts** (se necessário)
```typescript
// middleware.ts ou headers
const nonce = crypto.randomUUID();
headers: {
  'Content-Security-Policy': `script-src 'self' 'nonce-${nonce}'`
}
```

**B. Report-URI para monitorar violações**
```typescript
"report-uri /api/csp-report; report-to csp-endpoint"
```

---

### 3. Cookies & Auth

#### Estado atual
✅ Usando Better Auth (bom)

#### 🎯 Verificar configuração de cookies

```typescript
// lib/auth.ts - adicionar configuração de cookies
export const auth = betterAuth({
  // ... config existente
  session: {
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // ou 'strict'
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    }
  }
});
```

---

### 4. Rate Limiting

#### Estado atual
✅ **EXCELENTE**: Rate limiting já implementado em `middleware.ts`

Limites atuais:
- Admin: 10/min
- Chat: 5/min
- Takedown: 3/min
- Access check: 10/min
- Telemetry: 20/min
- API geral: 30/min
- Pages: 100/min

**🟡 Sugestão**: Para produção, considerar Redis/Upstash para rate limit distribuído.

---

## 📊 Checklist de Ações

### Alta Prioridade 🔴
- [ ] Criar endpoint agregador `/api/item-page/[slug]`
- [ ] Mover lógica de fetch da homepage para Server Component
- [ ] Criar `/src/lib/sanitize.ts` com DOMPurify centralizado
- [ ] Verificar índices de banco de dados (slug, itemId, userId)

### Média Prioridade 🟡
- [ ] Implementar ISR nas páginas de item
- [ ] Adicionar dynamic imports para componentes pesados
- [ ] Configurar cookies seguros no Better Auth
- [ ] Adicionar CSP report-uri para monitoramento

### Baixa Prioridade 🟢
- [ ] Migrar rate limiting para Redis/Upstash (produção)
- [ ] Adicionar nonces para CSP mais restritivo
- [ ] Implementar edge caching para assets estáticos

---

## 🎯 Impacto Esperado

### Performance
- **TTFB**: 5330ms → **< 500ms** (endpoint agregador + cache)
- **LCP**: Redução de 40-60% (Server Components + ISR)
- **Total Requests**: 4-5 requests → **1-2 requests** por página

### Segurança
- **XSS Protection**: Configuração DOMPurify centralizada e auditável
- **Cookie Security**: HttpOnly + Secure + SameSite configurados
- **CSP**: Monitoramento de violações habilitado

---

## 📝 Próximos Passos

1. Implementar `/src/lib/sanitize.ts`
2. Criar endpoint agregador de exemplo
3. Refatorar homepage para Server Component
4. Testar performance com Lighthouse
5. Documentar melhorias no README

---

**Última atualização**: 2025-11-17  
**Responsável**: Dev Team  
**Status**: Em progresso
