-- Schema Cleanup Migration [Story FH-4.4]
-- Fixes: redundant index, duplicate trigger function, missing composite index,
-- column type normalization

-- ============================================
-- 1. Drop redundant B-tree index on tuss_procedures.code
--    The UNIQUE constraint already creates an implicit index
-- ============================================
DROP INDEX IF EXISTS idx_tuss_code;

-- ============================================
-- 2. Consolidate trigger functions
--    Redirect tuss_procedures trigger to use the shared update_updated_at()
--    then drop the duplicate update_tuss_updated_at() function
-- ============================================
DROP TRIGGER IF EXISTS tuss_procedures_updated_at ON tuss_procedures;

CREATE TRIGGER tuss_procedures_updated_at
  BEFORE UPDATE ON tuss_procedures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP FUNCTION IF EXISTS update_tuss_updated_at();

-- ============================================
-- 3. Add composite index for common list queries
--    Pages listing medical accounts by status sorted by date
-- ============================================
CREATE INDEX IF NOT EXISTS idx_accounts_status_created
  ON medical_accounts(status, created_at DESC);

-- ============================================
-- 4. Normalize tuss_procedures price columns to DECIMAL(12,2)
--    Matches the precision used in medical_accounts and procedures tables
-- ============================================
ALTER TABLE tuss_procedures
  ALTER COLUMN unit_price TYPE DECIMAL(12, 2),
  ALTER COLUMN aux_price TYPE DECIMAL(12, 2),
  ALTER COLUMN film_price TYPE DECIMAL(12, 2);

-- ============================================
-- 5. Resize health_insurers.ans_code to VARCHAR(6)
--    ANS registry codes are exactly 6 digits
-- ============================================
ALTER TABLE health_insurers
  ALTER COLUMN ans_code TYPE VARCHAR(6);
