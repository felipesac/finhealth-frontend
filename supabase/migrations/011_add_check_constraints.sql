-- FH-2.2: Add missing CHECK constraints on status columns
-- Fixes Phase 2 findings L6, L7: procedures.status, sus_bpa.status, sus_aih.status
-- accept any string — now constrained to valid values.

-- ============================================
-- 1. Clean invalid status values (if any)
-- ============================================
-- Reset unexpected procedure statuses to 'pending'
UPDATE procedures SET status = 'pending'
  WHERE status NOT IN ('pending', 'approved', 'denied', 'appealed');

-- Reset unexpected SUS statuses to 'rascunho'
UPDATE sus_bpa SET status = 'rascunho'
  WHERE status NOT IN ('rascunho', 'validado', 'enviado', 'aprovado', 'rejeitado');

UPDATE sus_aih SET status = 'rascunho'
  WHERE status NOT IN ('rascunho', 'validado', 'enviado', 'aprovado', 'rejeitado');

-- ============================================
-- 2. Add CHECK constraints
-- ============================================
ALTER TABLE procedures
  ADD CONSTRAINT chk_procedures_status
  CHECK (status IN ('pending', 'approved', 'denied', 'appealed'));

ALTER TABLE sus_bpa
  ADD CONSTRAINT chk_sus_bpa_status
  CHECK (status IN ('rascunho', 'validado', 'enviado', 'aprovado', 'rejeitado'));

ALTER TABLE sus_aih
  ADD CONSTRAINT chk_sus_aih_status
  CHECK (status IN ('rascunho', 'validado', 'enviado', 'aprovado', 'rejeitado'));
