-- FH-2.1: Add missing FK constraints and updated_at columns
-- Fixes Phase 2 findings M1 (user_id FKs), M2 (health_insurance_id), M3 (updated_at)

-- ============================================
-- 1. Add updated_at to procedures and payments
-- ============================================
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill: set updated_at = created_at for existing rows
UPDATE procedures SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE payments SET updated_at = created_at WHERE updated_at IS NULL;

-- Add BEFORE UPDATE triggers (reuses update_updated_at() from migration 001)
CREATE TRIGGER procedures_updated_at
  BEFORE UPDATE ON procedures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 2. Clean orphaned records before adding FKs
-- ============================================
-- Delete rows where user_id references non-existent auth.users
DELETE FROM notifications
  WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM digital_certificates
  WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM sus_bpa
  WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM sus_aih
  WHERE user_id NOT IN (SELECT id FROM auth.users);

-- ============================================
-- 3. Add FK constraints for user_id columns
-- ============================================
ALTER TABLE notifications
  ADD CONSTRAINT fk_notifications_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE digital_certificates
  ADD CONSTRAINT fk_certificates_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE sus_bpa
  ADD CONSTRAINT fk_sus_bpa_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE sus_aih
  ADD CONSTRAINT fk_sus_aih_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================
-- 4. Deprecate patients.health_insurance_id
-- ============================================
-- Column is TEXT (not UUID FK), unused in application code.
-- Rename to signal deprecation; drop in a future migration after confirming no data loss.
ALTER TABLE patients RENAME COLUMN health_insurance_id TO health_insurance_id_deprecated;
COMMENT ON COLUMN patients.health_insurance_id_deprecated
  IS 'DEPRECATED (FH-2.1): Was TEXT, not UUID FK. Use health_insurer_id via medical_accounts instead. Will be dropped in a future migration.';
