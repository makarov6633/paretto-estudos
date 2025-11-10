-- ============================================
-- BACKUP SCRIPT - Execute ANTES da migration
-- ============================================
-- Data: 2025-11-10
-- Motivo: Remoção de tabelas de Quiz, Checklist, Notes
-- ============================================

-- 1. Backup da tabela user_gamification (campos que serão removidos)
CREATE TABLE IF NOT EXISTS user_gamification_backup_20251110 AS 
SELECT 
  "userId",
  "quizzesCompleted",
  "checklistsCompleted", 
  "notesCreated",
  "updatedAt"
FROM user_gamification;

-- 2. Backup completo das tabelas que serão removidas
CREATE TABLE IF NOT EXISTS checklist_backup_20251110 AS SELECT * FROM checklist;
CREATE TABLE IF NOT EXISTS user_checklist_progress_backup_20251110 AS SELECT * FROM user_checklist_progress;
CREATE TABLE IF NOT EXISTS quiz_question_backup_20251110 AS SELECT * FROM quiz_question;
CREATE TABLE IF NOT EXISTS quiz_answer_backup_20251110 AS SELECT * FROM quiz_answer;
CREATE TABLE IF NOT EXISTS user_note_backup_20251110 AS SELECT * FROM user_note;
CREATE TABLE IF NOT EXISTS study_session_backup_20251110 AS SELECT * FROM study_session;
CREATE TABLE IF NOT EXISTS point_transaction_backup_20251110 AS SELECT * FROM point_transaction;

-- 3. Contagem de registros (para validação)
SELECT 
  'checklist' as table_name, 
  COUNT(*) as count 
FROM checklist
UNION ALL
SELECT 'user_checklist_progress', COUNT(*) FROM user_checklist_progress
UNION ALL
SELECT 'quiz_question', COUNT(*) FROM quiz_question
UNION ALL
SELECT 'quiz_answer', COUNT(*) FROM quiz_answer
UNION ALL
SELECT 'user_note', COUNT(*) FROM user_note
UNION ALL
SELECT 'study_session', COUNT(*) FROM study_session
UNION ALL
SELECT 'point_transaction', COUNT(*) FROM point_transaction;

-- ============================================
-- Backup criado com sucesso!
-- Para restaurar, execute: scripts/rollback-migration.sql
-- ============================================
