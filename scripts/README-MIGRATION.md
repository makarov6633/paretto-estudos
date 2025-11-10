# 🗄️ Database Migration - Remoção de Sistemas de Estudo

## 📚 Contexto

Com o PR #12, removemos completamente os sistemas de **Quiz**, **Checklist** e **Notas** do código. Agora precisamos aplicar a migration correspondente no banco de dados.

---

## ⚡ Quick Start (Para quem tem pressa)

```bash
# 1. BACKUP (OBRIGATÓRIO!)
psql $POSTGRES_URL < scripts/backup-before-migration.sql

# 2. APLICAR MIGRATION
psql $POSTGRES_URL < drizzle/0008_remove_study_systems.sql

# 3. VALIDAR
psql $POSTGRES_URL -c "SELECT table_name FROM information_schema.tables WHERE table_name IN ('checklist', 'quiz_question', 'user_note') AND table_schema = 'public';"

# Deve retornar vazio = sucesso! ✅
```

---

## 📖 Passo a Passo Detalhado

### **Passo 1: Preparação**

#### 1.1. Verifique se tem acesso ao banco
```bash
psql $POSTGRES_URL -c "SELECT version();"
```

#### 1.2. Verifique quais tabelas existem
```bash
psql $POSTGRES_URL -c "\dt"
```

---

### **Passo 2: BACKUP (CRÍTICO!)**

#### Opção A: Backup Completo (Recomendado)
```bash
# Cria backup completo
pg_dump $POSTGRES_URL > backup_full_$(date +%Y%m%d_%H%M%S).sql

# Verifique o tamanho do backup
ls -lh backup_full_*.sql
```

#### Opção B: Backup Apenas das Tabelas Afetadas
```bash
# Execute o script de backup
psql $POSTGRES_URL < scripts/backup-before-migration.sql

# Verifique se os backups foram criados
psql $POSTGRES_URL -c "\dt *backup*"
```

**⚠️ NÃO PULE ESTE PASSO!**

---

### **Passo 3: Aplicar Migration**

#### Método 1: Via psql (Manual)
```bash
psql $POSTGRES_URL < drizzle/0008_remove_study_systems.sql
```

#### Método 2: Via Drizzle Kit (Recomendado)
```bash
# Drizzle aplica automaticamente migrations pendentes
pnpm run db:migrate
```

**Saída esperada:**
```
✅ Applying migration 0008_remove_study_systems...
✅ Migration applied successfully!
```

---

### **Passo 4: Validação**

#### 4.1. Verificar tabelas removidas
```bash
psql $POSTGRES_URL << 'EOF'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'checklist',
    'user_checklist_progress',
    'quiz_question',
    'quiz_answer',
    'user_note',
    'study_session',
    'point_transaction'
  );
EOF
```

**Resultado esperado:** `(0 rows)` ✅

#### 4.2. Verificar campos removidos
```bash
psql $POSTGRES_URL << 'EOF'
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_gamification'
  AND column_name IN ('quizzesCompleted', 'checklistsCompleted', 'notesCreated');
EOF
```

**Resultado esperado:** `(0 rows)` ✅

#### 4.3. Verificar tabelas mantidas
```bash
psql $POSTGRES_URL -c "SELECT COUNT(*) FROM user_gamification;"
psql $POSTGRES_URL -c "SELECT COUNT(*) FROM reading_event;"
psql $POSTGRES_URL -c "SELECT COUNT(*) FROM reading_progress;"
```

**Resultado esperado:** Contagens normais ✅

---

### **Passo 5: Testes da Aplicação**

```bash
# 1. Typecheck
pnpm run typecheck

# 2. Lint
pnpm run lint

# 3. Dev server
pnpm dev

# 4. Teste manualmente:
#    - Login com Google
#    - Acessar biblioteca
#    - Abrir um resumo
#    - Navegar com sidebar
#    - Testar controles de leitura
#    - Verificar dashboard
#    - Verificar gamificação
```

---

## 🔄 Rollback (Se algo der errado)

### Cenário 1: Migration falhou no meio

```bash
# 1. Verificar qual tabela causou o erro
psql $POSTGRES_URL -c "\dt"

# 2. Executar rollback
psql $POSTGRES_URL < scripts/rollback-migration.sql

# 3. Reverter código
git reset --hard origin/main~1

# 4. Reinstalar
pnpm install

# 5. Reiniciar servidor
pnpm dev
```

### Cenário 2: Aplicação não funciona após migration

```bash
# 1. Restaurar backup completo
psql $POSTGRES_URL < backup_full_YYYYMMDD_HHMMSS.sql

# 2. Verificar integridade
psql $POSTGRES_URL -c "SELECT COUNT(*) FROM user;"

# 3. Se estiver OK, investigar o problema
pnpm run typecheck
tail -f logs/error.log
```

---

## 📊 Estimativa de Tempo

| Etapa | Tempo Estimado |
|-------|----------------|
| Backup | 30 segundos |
| Migration | 1 segundo |
| Validação | 10 segundos |
| Testes | 2-5 minutos |
| **TOTAL** | **~3-6 minutos** |

---

## 🎯 Comandos Rápidos de Referência

```bash
# Backup
psql $POSTGRES_URL < scripts/backup-before-migration.sql

# Migration
psql $POSTGRES_URL < drizzle/0008_remove_study_systems.sql

# Validação
psql $POSTGRES_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE '%quiz%' OR table_name LIKE '%checklist%' OR table_name LIKE '%note%';"

# Rollback (emergência)
psql $POSTGRES_URL < scripts/rollback-migration.sql

# Limpar backups (depois de confirmar que está OK)
psql $POSTGRES_URL -c "DROP TABLE IF EXISTS checklist_backup_20251110, user_checklist_progress_backup_20251110, quiz_question_backup_20251110, quiz_answer_backup_20251110, user_note_backup_20251110, study_session_backup_20251110, point_transaction_backup_20251110, user_gamification_backup_20251110 CASCADE;"
```

---

## ✅ Checklist Final

Após tudo funcionar:

- [ ] Migration aplicada com sucesso
- [ ] Validação passou (0 tabelas antigas encontradas)
- [ ] Aplicação funcionando normalmente
- [ ] Testes manuais realizados
- [ ] TypeCheck passou
- [ ] Backup guardado em local seguro
- [ ] Equipe notificada sobre conclusão
- [ ] Backups antigos agendados para remoção (após 7 dias)

---

**Migration criada com segurança! 🛡️**
