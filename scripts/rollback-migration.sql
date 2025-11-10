-- ============================================
-- ROLLBACK SCRIPT - Use APENAS em caso de emergência
-- ============================================
-- Este script restaura as tabelas removidas
-- ATENÇÃO: Execute APENAS se algo der errado!
-- ============================================

-- 1. Restaurar tabelas removidas
CREATE TABLE IF NOT EXISTS checklist AS SELECT * FROM checklist_backup_20251110;
CREATE TABLE IF NOT EXISTS user_checklist_progress AS SELECT * FROM user_checklist_progress_backup_20251110;
CREATE TABLE IF NOT EXISTS quiz_question AS SELECT * FROM quiz_question_backup_20251110;
CREATE TABLE IF NOT EXISTS quiz_answer AS SELECT * FROM quiz_answer_backup_20251110;
CREATE TABLE IF NOT EXISTS user_note AS SELECT * FROM user_note_backup_20251110;
CREATE TABLE IF NOT EXISTS study_session AS SELECT * FROM study_session_backup_20251110;
CREATE TABLE IF NOT EXISTS point_transaction AS SELECT * FROM point_transaction_backup_20251110;

-- 2. Restaurar campos removidos de user_gamification
ALTER TABLE user_gamification 
  ADD COLUMN IF NOT EXISTS "quizzesCompleted" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "checklistsCompleted" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "notesCreated" integer NOT NULL DEFAULT 0;

-- 3. Restaurar valores dos campos
UPDATE user_gamification ug
SET 
  "quizzesCompleted" = b."quizzesCompleted",
  "checklistsCompleted" = b."checklistsCompleted",
  "notesCreated" = b."notesCreated"
FROM user_gamification_backup_20251110 b
WHERE ug."userId" = b."userId";

-- ============================================
-- ATENÇÃO: Após rollback, você precisará:
-- 1. Reverter o código no Git
-- 2. Reinstalar dependências
-- 3. Reiniciar o servidor
-- ============================================
