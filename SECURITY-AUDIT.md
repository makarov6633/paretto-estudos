# Auditoria de Segurança - Paretto Estudos

Análise de vulnerabilidades e pontos fracos do projeto.

---

## 🔴 CRÍTICO - Necessita correção URGENTE

### 1. **Autenticação sem BETTER_AUTH_SECRET configurado**
**Arquivo**: [src/lib/auth.ts](src/lib/auth.ts:5-15)

**Problema**: Better Auth não valida se `BETTER_AUTH_SECRET` existe. Se não estiver configurado, as sessões podem ser vulneráveis.

**Impacto**: Sessões podem ser forjadas, bypass de autenticação.

**Solução**:
```typescript
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || (() => {
    throw new Error('BETTER_AUTH_SECRET is required')
  })(),
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  // ...
});
```

---

### 2. **Rate Limiting em memória - não funciona em produção distribuída**
**Arquivo**: [src/middleware.ts](src/middleware.ts:5-21)

**Problema**:
- Rate limiting usa `Map` em memória (linha 8)
- Em produção com múltiplas instâncias (Vercel serverless), cada instância tem seu próprio contador
- Atacante pode fazer N × limite de requisições (N = número de instâncias)

**Impacto**: Proteção contra DDoS ineficaz, vulnerabilidade a ataques de força bruta.

**Solução**: Usar Redis ou Vercel KV para rate limiting distribuído:
```typescript
import { kv } from '@vercel/kv';

async function allow(key: string, limit: number) {
  const current = await kv.incr(key);
  if (current === 1) {
    await kv.expire(key, 60); // 60 segundos
  }
  return current <= limit;
}
```

---

### 3. **Falta de proteção CSRF em endpoints de mutação**
**Arquivo**: [src/app/api/stripe/webhook/route.ts](src/app/api/stripe/webhook/route.ts:23-107)

**Problema**:
- Webhook do Stripe valida assinatura (OK)
- Mas outros endpoints POST/PUT/DELETE não validam CSRF token
- Better Auth tem CSRF embutido, mas não está sendo usado

**Impacto**: Atacante pode fazer requisições em nome do usuário logado.

**Solução**: Implementar middleware CSRF para rotas sensíveis.

---

## 🟠 ALTO - Necessita correção em breve

### 4. **Acesso a arquivos estáticos sem autenticação**
**Arquivo**: [public/media/](public/media/)

**Problema**:
- PDFs e áudios em `/public/media/` são públicos
- Qualquer pessoa com a URL pode acessar sem login ou assinatura
- Exemplo: `https://seusite.com/media/pdf/livro-premium.pdf`

**Impacto**: Bypass completo do paywall, conteúdo premium acessível sem pagar.

**Solução**:
- Mover arquivos para fora de `/public/`
- Criar endpoint autenticado: `/api/media/[type]/[filename]`
- Validar acesso antes de servir arquivo
```typescript
export async function GET(req: Request, { params }: { params: { type: string, filename: string } }) {
  const userId = await getUserIdFromSession(req);
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const accessCheck = await checkUserAccess(userId);
  if (!accessCheck.allowed) return new Response('Forbidden', { status: 403 });

  const filePath = path.join(process.cwd(), 'private', params.type, params.filename);
  const file = await fs.readFile(filePath);
  return new Response(file);
}
```

---

### 5. **Free tier bypassável - falta validação no cliente**
**Arquivo**: [src/app/api/access/check/route.ts](src/app/api/access/check/route.ts:60-84)

**Problema**:
- Endpoint `/api/access/check` apenas **verifica** acesso
- Não há enforcement no lado do servidor quando usuário acessa `/item/[slug]/read`
- Cliente React pode ignorar o check e carregar conteúdo diretamente

**Impacto**: Usuário free pode acessar conteúdo ilimitado.

**Solução**: Validar acesso em **todos** os endpoints que servem conteúdo:
```typescript
// Em /api/items?slug=X&expand=full
const userId = await getUserIdFromSession(req);
if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

const accessCheck = await checkAccess(userId, itemId);
if (!accessCheck.allowed) {
  return NextResponse.json({ error: 'Upgrade required' }, { status: 402 });
}
```

---

### 6. **SQL Injection (baixo risco, mas presente)**
**Arquivo**: [src/app/api/items/route.ts](src/app/api/items/route.ts:139-146)

**Problema**:
- Drizzle ORM protege contra SQL injection em queries parametrizadas (OK)
- Mas usa `ilike` com interpolação direta de `q` (linha 141)
- Drizzle escapa automaticamente, mas depende da versão

**Exemplo potencialmente perigoso**:
```typescript
whereClauses.push(ilike(item.title, `%${q}%`)); // q vem do usuário
```

**Impacto**: Baixo - Drizzle escapa automaticamente, mas má prática.

**Solução**: Usar placeholders explícitos (já está correto na prática).

---

## 🟡 MÉDIO - Boas práticas e melhorias

### 7. **Erro handling expõe informações sensíveis**
**Arquivo**: [src/app/api/stripe/webhook/route.ts](src/app/api/stripe/webhook/route.ts:103-106)

**Problema**:
```typescript
} catch (e) {
  console.error("Stripe webhook error", e);
}
return NextResponse.json({ received: true }); // sempre retorna sucesso!
```

**Impacto**:
- Erros no webhook não são rastreados
- Logs podem vazar informações no console (se exposto)

**Solução**:
```typescript
} catch (e) {
  console.error("Stripe webhook error", e);
  // Considere enviar para Sentry/logging service
  return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
}
```

---

### 8. **Missing rate limiting em endpoints críticos**
**Arquivo**: [src/app/api/access/check/route.ts](src/app/api/access/check/route.ts)

**Problema**:
- `/api/access/check` pode ser chamado infinitamente
- Atacante pode fazer brute force para descobrir userIds válidos

**Solução**: Rate limit mais agressivo para este endpoint (5 req/min por IP).

---

### 9. **Falta de validação de input em telemetry**
**Arquivo**: [src/app/item/[slug]/read/page.tsx](src/app/item/[slug]/read/page.tsx:69)

**Problema**:
```typescript
fetch('/api/telemetry', {
  body: JSON.stringify({ userId: session.user.id, itemId: item.id, name: 'open' })
})
```

- Não valida se `itemId` existe
- Não valida se `name` é um evento válido

**Impacto**: Poluição de dados, possível exploração.

**Solução**: Validar no servidor com Zod:
```typescript
const schema = z.object({
  userId: z.string().uuid(),
  itemId: z.string().uuid(),
  name: z.enum(['open', 'play', 'finish'])
});
```

---

### 10. **Environment variables não validadas no startup**
**Arquivo**: [src/lib/auth.ts](src/lib/auth.ts:10-13)

**Problema**:
```typescript
clientId: process.env.GOOGLE_CLIENT_ID as string,
clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
```

- Força type cast sem validar se existe
- App pode iniciar com configuração inválida

**Solução**:
```typescript
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing Google OAuth credentials');
}
```

---

### 11. **Falta de logs de auditoria**

**Problema**: Nenhum log de ações críticas:
- Criação/cancelamento de assinaturas
- Tentativas de acesso negadas
- Mudanças em dados sensíveis

**Solução**: Implementar audit log:
```typescript
await db.insert(auditLog).values({
  userId,
  action: 'subscription.created',
  metadata: { subscriptionId, plan: 'premium' },
  timestamp: new Date()
});
```

---

### 12. **Missing backup strategy**

**Problema**: Sem plano de backup do banco de dados documentado.

**Solução**:
- Vercel Postgres: backups automáticos diários (verificar)
- Documentar procedimento de restore
- Testar restore mensalmente

---

## 🔵 BAIXO - Observações e otimizações

### 13. **Sem Content-Type validation em uploads**
- Atualmente não há upload de arquivos pelo usuário (OK)
- Se implementar futuramente, validar MIME type

### 14. **Falta de monitoramento de performance**
- Sem APM (Application Performance Monitoring)
- Considerar: Vercel Analytics, Sentry

### 15. **Dependências desatualizadas**
```bash
pnpm audit
```
Rodar regularmente para verificar CVEs conhecidas.

---

## ✅ Pontos Positivos (já implementados corretamente)

1. ✅ CSP headers configurados ([next.config.ts](next.config.ts))
2. ✅ HSTS em produção
3. ✅ Stripe webhook signature validation
4. ✅ Better Auth com OAuth (Google)
5. ✅ Drizzle ORM (proteção contra SQL injection)
6. ✅ Rate limiting básico implementado
7. ✅ Sem hardcoded secrets (usa env vars)

---

## Priorização de Correções

### Urgente (fazer antes do deploy):
1. ⚠️ Proteger arquivos em `/public/media/` (#4)
2. ⚠️ Adicionar validation de `BETTER_AUTH_SECRET` (#1)
3. ⚠️ Implementar enforcement de acesso no servidor (#5)

### Importante (primeira semana pós-deploy):
4. Migrar rate limiting para Redis/KV (#2)
5. Adicionar CSRF protection (#3)
6. Implementar audit logs (#11)

### Desejável (primeiro mês):
7. Melhorar error handling (#7)
8. Rate limiting granular (#8)
9. Input validation com Zod (#9)
10. Backup strategy (#12)

---

## Comandos para testar segurança

```bash
# Verificar secrets expostos
.tools/qlty/qlty.exe check --filter gitleaks src scripts

# Verificar dependências vulneráveis
pnpm audit

# Test rate limiting
for i in {1..100}; do curl http://localhost:3000/api/items; done

# Test unauthorized access
curl http://localhost:3000/media/pdf/pai-rico-pai-pobre-resumo-completo.pdf
```

---

**Conclusão**: O projeto tem boa base de segurança, mas **vulnerabilidades críticas #1, #4 e #5 devem ser corrigidas antes do deploy em produção**.
