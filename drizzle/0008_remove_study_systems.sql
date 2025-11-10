-- Migration: 0008_remove_study_systems
-- Description: Remove sistemas de Quiz, Checklist e Notas não utilizados
-- Date: 2025-11-10
-- ATENÇÃO: Execute backup-before-migration.sql ANTES desta migration!

-- ============================================
-- PARTE 1: Remover campos de user_gamification
-- ============================================

-- Remove campos relacionados a quiz, checklist e notas
ALTER TABLE "user_gamification" 
  DROP COLUMN IF EXISTS "quizzesCompleted",
  DROP COLUMN IF EXISTS "checklistsCompleted",
  DROP COLUMN IF EXISTS "notesCreated";

-- ============================================
-- PARTE 2: Remover tabelas de sistemas não utilizados
-- ============================================

-- Remover tabela de transações de pontos (já não é mais usada)
DROP TABLE IF EXISTS "point_transaction" CASCADE;

-- Remover tabelas de sessões de estudo
DROP TABLE IF EXISTS "study_session" CASCADE;

-- Remover tabelas de notas
DROP TABLE IF EXISTS "user_note" CASCADE;

-- Remover tabelas de quiz (respostas primeiro, depois perguntas)
DROP TABLE IF EXISTS "quiz_answer" CASCADE;
DROP TABLE IF EXISTS "quiz_question" CASCADE;

-- Remover tabelas de checklist (progresso primeiro, depois checklist)
DROP TABLE IF EXISTS "user_checklist_progress" CASCADE;
DROP TABLE IF EXISTS "checklist" CASCADE;

-- ============================================
-- VALIDAÇÃO: Verificar se as tabelas foram removidas
-- ============================================

-- Execute esta query para confirmar:
/*
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
*/
-- Se retornar vazio, a migration foi bem-sucedida!

-- ============================================
-- IMPORTANTE: 
-- - Backup está em: scripts/backup-before-migration.sql
-- - Rollback está em: scripts/rollback-migration.sql
-- - Em caso de erro, execute o rollback imediatamente
-- ============================================
