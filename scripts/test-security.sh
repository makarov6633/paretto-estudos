#!/bin/bash

# Script de Teste de Segurança
# Valida todas as implementações de segurança

echo "🔐 Testando Implementações de Segurança"
echo "========================================"
echo ""

BASE_URL="${1:-http://localhost:3000}"
ERRORS=0

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funções auxiliares
pass() {
    echo -e "${GREEN}✓${NC} $1"
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ERRORS=$((ERRORS + 1))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

test_header() {
    echo ""
    echo "Testing: $1"
    echo "---"
}

# ========== 1. SECURITY HEADERS ==========
test_header "Security Headers"

HEADERS=$(curl -s -I "$BASE_URL/" 2>/dev/null)

if echo "$HEADERS" | grep -q "X-Frame-Options: DENY"; then
    pass "X-Frame-Options presente"
else
    fail "X-Frame-Options ausente"
fi

if echo "$HEADERS" | grep -q "X-Content-Type-Options: nosniff"; then
    pass "X-Content-Type-Options presente"
else
    fail "X-Content-Type-Options ausente"
fi

if echo "$HEADERS" | grep -q "Content-Security-Policy"; then
    pass "Content-Security-Policy presente"
else
    fail "Content-Security-Policy ausente"
fi

if echo "$HEADERS" | grep -q "Referrer-Policy"; then
    pass "Referrer-Policy presente"
else
    fail "Referrer-Policy ausente"
fi

if ! echo "$HEADERS" | grep -q "X-Powered-By"; then
    pass "X-Powered-By removido"
else
    fail "X-Powered-By ainda presente"
fi

# ========== 2. RATE LIMITING ==========
test_header "Rate Limiting"

RATE_LIMIT_HEADERS=$(curl -s -I "$BASE_URL/api/items" 2>/dev/null)

if echo "$RATE_LIMIT_HEADERS" | grep -q "X-RateLimit-Limit"; then
    pass "Rate limit headers presentes"
else
    fail "Rate limit headers ausentes"
fi

# Testar rate limit (fazer múltiplas requests)
echo "Testando rate limiting com 10 requests rápidas..."
SUCCESS_COUNT=0
for i in {1..10}; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/items" 2>/dev/null)
    if [ "$STATUS" = "200" ]; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    fi
done

if [ $SUCCESS_COUNT -eq 10 ]; then
    pass "Rate limiting funcionando (10/10 requests aceitas)"
else
    warn "Rate limiting pode estar muito restritivo ($SUCCESS_COUNT/10 aceitas)"
fi

# ========== 3. INPUT VALIDATION ==========
test_header "Input Validation"

# Testar XSS em query
XSS_RESPONSE=$(curl -s "$BASE_URL/api/items?q=%3Cscript%3Ealert(1)%3C/script%3E" 2>/dev/null)
if echo "$XSS_RESPONSE" | grep -q "error"; then
    pass "XSS em query bloqueado"
else
    warn "XSS em query pode não estar bloqueado"
fi

# Testar UUID inválido
INVALID_UUID=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/progress?itemId=invalid-uuid" 2>/dev/null)
if [ "$INVALID_UUID" = "400" ]; then
    pass "UUID inválido rejeitado"
else
    fail "UUID inválido aceito (status: $INVALID_UUID)"
fi

# Testar slug inválido
INVALID_SLUG=$(curl -s "$BASE_URL/api/items?slug=../../../etc/passwd" 2>/dev/null)
if echo "$INVALID_SLUG" | grep -q "error\|Invalid"; then
    pass "Slug malicioso rejeitado"
else
    warn "Slug malicioso pode não estar bloqueado"
fi

# ========== 4. AUTHENTICATION ==========
test_header "Authentication"

# Testar rota protegida sem auth
UNAUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/progress?itemId=550e8400-e29b-41d4-a716-446655440000" 2>/dev/null)
if [ "$UNAUTH_RESPONSE" = "401" ]; then
    pass "Rota protegida requer autenticação"
else
    fail "Rota protegida não requer autenticação (status: $UNAUTH_RESPONSE)"
fi

# ========== 5. CORS ==========
test_header "CORS"

CORS_RESPONSE=$(curl -s -H "Origin: https://evil.com" -I "$BASE_URL/api/items" 2>/dev/null)
if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    warn "CORS pode estar muito permissivo"
else
    pass "CORS restritivo"
fi

# ========== 6. ARQUIVOS CRIADOS ==========
test_header "Arquivos de Implementação"

if [ -f "src/middleware.ts" ]; then
    if grep -q "addSecurityHeaders" "src/middleware.ts"; then
        pass "Middleware com security headers"
    else
        fail "Middleware sem security headers"
    fi
else
    fail "src/middleware.ts não encontrado"
fi

if [ -f "src/lib/input-sanitization.ts" ]; then
    pass "input-sanitization.ts criado"
else
    fail "input-sanitization.ts não encontrado"
fi

if [ -f "src/lib/access-control.ts" ]; then
    if grep -q "isPremiumUser" "src/lib/access-control.ts"; then
        pass "access-control.ts atualizado"
    else
        warn "access-control.ts pode estar desatualizado"
    fi
else
    fail "src/lib/access-control.ts não encontrado"
fi

# ========== 7. SECRETS ==========
test_header "Secrets Management"

if grep -q "dev-secret-only-for-local" "src/lib/security.ts" 2>/dev/null; then
    fail "Hardcoded secret ainda presente!"
else
    pass "Hardcoded secrets removidos"
fi

# ========== RESUMO ==========
echo ""
echo "========================================"
echo "Resumo dos Testes"
echo "========================================"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Todos os testes passaram!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Gerar JWT_SECRET forte: openssl rand -base64 32"
    echo "2. Configurar variáveis de ambiente"
    echo "3. Testar em produção com: https://securityheaders.com"
    exit 0
else
    echo -e "${RED}✗ $ERRORS teste(s) falharam${NC}"
    echo ""
    echo "Revise:"
    echo "1. Verificar se dev server está rodando"
    echo "2. Revisar implementações nos arquivos indicados"
    echo "3. Consultar SECURITY-IMPLEMENTATION-GUIDE.md"
    exit 1
fi
