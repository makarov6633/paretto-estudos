# 📦 Guia de Migration - Remoção de Sistemas de Estudo

## ⚠️ IMPORTANTE: Leia antes de executar!

Esta migration remove completamente os sistemas de **Quiz**, **Checklist** e **Notas** do banco de dados.

---

## 🎯 O que será removido

### Tabelas que serão deletadas:
- `checklist`
- `user_checklist_progress`
- `quiz_question`
- `quiz_answer`
- `user_note`
- `study_session`
- `point_transaction`

### Campos que serão removidos de `user_gamification`:
- `quizzesCompleted`
- `checklistsCompleted`
- `notesCreated`

---

## 📋 Passo a Passo SEGURO

### **1. BACKUP (OBRIGATÓRIO!)**

Antes de tudo, faça backup do banco de dados:

```bash
# Opção A: Backup completo do PostgreSQL
pg_dump $POSTGRES_URL > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql

# Opção B: Backup apenas das tabelas afetadas
psql $POSTGRES_URL < scripts/backup-before-migration.sql
```

**Verifique se o backup foi criado antes de continuar!**

---

### **2. APLICAR MIGRATION**

```bash
# Execute a migration
psql $POSTGRES_URL < drizzle/0008_remove_study_systems.sql
```

**OU use o Drizzle (recomendado):**

```bash
pnpm run db:migrate
```

---

### **3. VALIDAR**

Verifique se as tabelas foram removidas:

```sql
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
```

**Resultado esperado:** Nenhuma linha retornada (tabelas removidas com sucesso)

Verifique os campos de `user_gamification`:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_gamification'
  AND column_name IN ('quizzesCompleted', 'checklistsCompleted', 'notesCreated');
```

**Resultado esperado:** Nenhuma linha retornada (campos removidos com sucesso)

---

### **4. TESTAR APLICAÇÃO**

Após a migration, teste:

```bash
# 1. Instalar dependências (se necessário)
pnpm install

# 2. Rodar typecheck
pnpm run typecheck

# 3. Iniciar servidor de desenvolvimento
pnpm dev

# 4. Testar funcionalidades:
#    - Login
#    - Biblioteca
#    - Leitura de resumos
#    - Dashboard
#    - Gamificação
```

---

## 🔄 ROLLBACK (Em caso de problema)

Se algo der errado, restaure o backup:

### **Opção A: Restaurar backup completo**
```bash
psql $POSTGRES_URL < backup_pre_migration_YYYYMMDD_HHMMSS.sql
```

### **Opção B: Rollback parcial (apenas tabelas removidas)**
```bash
psql $POSTGRES_URL < scripts/rollback-migration.sql
```

**IMPORTANTE:** Após o rollback, você precisa:
1. Reverter o código: `git revert HEAD` ou `git reset --hard origin/main~1`
2. Reinstalar: `pnpm install`
3. Reiniciar servidor

---

## ✅ Checklist de Segurança

Antes de executar a migration, confirme:

- [ ] Backup completo do banco criado
- [ ] Backup testado (consegue restaurar?)
- [ ] Ambiente de staging testado (se disponível)
- [ ] Código atualizado (`git pull origin main`)
- [ ] Dependências instaladas (`pnpm install`)
- [ ] TypeCheck passou (`pnpm run typecheck`)
- [ ] Horário adequado (baixo tráfego de usuários)
- [ ] Equipe notificada sobre a manutenção

---

## 📊 Impacto Esperado

### Dados Afetados:
- **0 usuários** (sistemas nunca foram usados em produção)
- **0 registros** em tabelas de quiz/checklist/notas

### Downtime:
- **Estimado:** < 1 segundo
- **Tipo:** Zero-downtime (DROPs são instantâneos)

### Performance:
- **Melhoria:** Banco mais leve e rápido
- **Índices:** Removidos automaticamente
- **Storage:** Recuperado após VACUUM

---

## 🚀 Pós-Migration

Após migration bem-sucedida:

### 1. Limpar backups antigos (depois de 7 dias)
```sql
-- Liste tabelas de backup
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%_backup_%';

-- Remova manualmente quando confirmar que tudo está OK
-- DROP TABLE checklist_backup_20251110;
-- DROP TABLE user_checklist_progress_backup_20251110;
-- etc...
```

### 2. Otimizar banco (opcional)
```sql
-- Recupera espaço em disco
VACUUM FULL ANALYZE;
```

### 3. Validar integridade
```sql
-- Verifica integridade referencial
SELECT * FROM pg_constraint WHERE contype = 'f';
```

---

## 📞 Suporte

Em caso de problemas:

1. **Não entre em pânico!** O backup existe.
2. **Execute o rollback** se necessário
3. **Documente o erro** com logs completos
4. **Abra uma issue** no GitHub com detalhes

---

## 📝 Log de Execução

Ao executar a migration, documente aqui:

```
Data: ____________________
Hora: ____________________
Executado por: ___________
Resultado: [ ] Sucesso [ ] Falha
Observações:
________________________________
________________________________
```

---

**Boa sorte! 🍀**
