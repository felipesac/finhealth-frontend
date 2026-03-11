-- ============================================================================
-- 017: Squad Database Alignment
-- ============================================================================
-- Aligns the Supabase schema with finhealth-squad agent requirements.
--
-- Changes:
--   1. Creates payment_items table (needed by Reconciliation Agent)
--   2. Extends audit_logs with agent tracking columns
--   3. Widens financial DECIMAL columns from (12,2) to (15,2)
--
-- All changes are additive and backward-compatible.
-- ROLLBACK: See bottom of file.
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: payment_items table
-- ============================================================================
-- The Reconciliation Agent needs line-item detail for payment matching.
-- Each payment from an insurer contains multiple items (one per guide/account).
-- This table enables: exact match, fuzzy match, partial glosa tracking.

CREATE TABLE IF NOT EXISTS payment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  medical_account_id UUID REFERENCES medical_accounts(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Matching reference
  guide_number VARCHAR(20),

  -- Financial
  paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  glosa_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,

  -- Reconciliation status
  match_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (match_status IN ('pending', 'matched', 'partial', 'unmatched')),
  match_confidence DECIMAL(5, 2),

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_items_payment ON payment_items(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_items_account ON payment_items(medical_account_id);
CREATE INDEX IF NOT EXISTS idx_payment_items_org ON payment_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_items_status ON payment_items(match_status);
CREATE INDEX IF NOT EXISTS idx_payment_items_guide ON payment_items(guide_number);
CREATE INDEX IF NOT EXISTS idx_payment_items_org_status ON payment_items(organization_id, match_status);

-- Trigger: updated_at
CREATE TRIGGER payment_items_updated_at
  BEFORE UPDATE ON payment_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Comments
COMMENT ON TABLE payment_items IS 'Line-item detail from insurer payment files — used by Reconciliation Agent';
COMMENT ON COLUMN payment_items.guide_number IS 'TISS guide number for matching against medical_accounts.tiss_guide_number';
COMMENT ON COLUMN payment_items.match_status IS 'pending=not yet processed, matched=exact match, partial=amount differs, unmatched=no matching account found';
COMMENT ON COLUMN payment_items.match_confidence IS 'Reconciliation Agent confidence score (0.00-1.00) for fuzzy matches';

-- RLS: org-scoped (same pattern as migration 016)
ALTER TABLE payment_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org read" ON payment_items
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT user_org_ids()) OR is_admin());

CREATE POLICY "Org insert" ON payment_items
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT user_org_ids())
    AND user_org_role(organization_id) IN ('admin', 'billing')
  );

CREATE POLICY "Org update" ON payment_items
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT user_org_ids())
    AND user_org_role(organization_id) IN ('admin', 'billing')
  );

CREATE POLICY "Org delete" ON payment_items
  FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT user_org_ids())
    AND user_org_role(organization_id) = 'admin'
  );

CREATE POLICY "Service role" ON payment_items
  FOR ALL TO service_role
  USING (true);

-- ============================================================================
-- SECTION 2: Extend audit_logs for agent tracking
-- ============================================================================
-- Squad agents (billing, auditor, reconciliation, cashflow, supervisor)
-- need to log which agent performed each action plus detailed change diffs.

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS agent VARCHAR(100),
  ADD COLUMN IF NOT EXISTS changes JSONB;

CREATE INDEX IF NOT EXISTS idx_audit_logs_agent ON audit_logs(agent);

COMMENT ON COLUMN audit_logs.agent IS 'AI agent that performed this action (e.g. billing-agent, auditor-agent)';
COMMENT ON COLUMN audit_logs.changes IS 'Before/after diff for agent operations — JSONB with {field: {old, new}} structure';

-- ============================================================================
-- SECTION 3: Widen financial DECIMAL columns to (15,2)
-- ============================================================================
-- Squad schema uses DECIMAL(15,2) for financial fields.
-- Frontend used DECIMAL(12,2) — max R$9,999,999,999.99 (~R$10B).
-- Widening to DECIMAL(15,2) — max R$9,999,999,999,999.99 (~R$10T).
-- This is a non-breaking change (strictly wider precision, no data loss).
-- Needed for: large hospital chain aggregations, cashflow forecasting.

-- medical_accounts
ALTER TABLE medical_accounts
  ALTER COLUMN total_amount TYPE DECIMAL(15, 2),
  ALTER COLUMN approved_amount TYPE DECIMAL(15, 2),
  ALTER COLUMN glosa_amount TYPE DECIMAL(15, 2),
  ALTER COLUMN paid_amount TYPE DECIMAL(15, 2);

-- procedures
ALTER TABLE procedures
  ALTER COLUMN unit_price TYPE DECIMAL(15, 2),
  ALTER COLUMN total_price TYPE DECIMAL(15, 2);

-- glosas
ALTER TABLE glosas
  ALTER COLUMN original_amount TYPE DECIMAL(15, 2),
  ALTER COLUMN glosa_amount TYPE DECIMAL(15, 2);

-- payments
ALTER TABLE payments
  ALTER COLUMN total_amount TYPE DECIMAL(15, 2),
  ALTER COLUMN matched_amount TYPE DECIMAL(15, 2),
  ALTER COLUMN unmatched_amount TYPE DECIMAL(15, 2);

-- glosa_notifications
ALTER TABLE glosa_notifications
  ALTER COLUMN potential_amount TYPE DECIMAL(15, 2);

-- tuss_procedures (re-widen from 12,2 set in migration 012)
ALTER TABLE tuss_procedures
  ALTER COLUMN unit_price TYPE DECIMAL(15, 2),
  ALTER COLUMN aux_price TYPE DECIMAL(15, 2),
  ALTER COLUMN film_price TYPE DECIMAL(15, 2);

COMMIT;

-- ============================================================================
-- ROLLBACK SCRIPT (run manually if needed)
-- ============================================================================
-- BEGIN;
--
-- -- Section 3: Revert DECIMAL widening to (12,2)
-- ALTER TABLE medical_accounts
--   ALTER COLUMN total_amount TYPE DECIMAL(12, 2),
--   ALTER COLUMN approved_amount TYPE DECIMAL(12, 2),
--   ALTER COLUMN glosa_amount TYPE DECIMAL(12, 2),
--   ALTER COLUMN paid_amount TYPE DECIMAL(12, 2);
-- ALTER TABLE procedures
--   ALTER COLUMN unit_price TYPE DECIMAL(12, 2),
--   ALTER COLUMN total_price TYPE DECIMAL(12, 2);
-- ALTER TABLE glosas
--   ALTER COLUMN original_amount TYPE DECIMAL(12, 2),
--   ALTER COLUMN glosa_amount TYPE DECIMAL(12, 2);
-- ALTER TABLE payments
--   ALTER COLUMN total_amount TYPE DECIMAL(12, 2),
--   ALTER COLUMN matched_amount TYPE DECIMAL(12, 2),
--   ALTER COLUMN unmatched_amount TYPE DECIMAL(12, 2);
-- ALTER TABLE glosa_notifications
--   ALTER COLUMN potential_amount TYPE DECIMAL(12, 2);
-- ALTER TABLE tuss_procedures
--   ALTER COLUMN unit_price TYPE DECIMAL(12, 2),
--   ALTER COLUMN aux_price TYPE DECIMAL(12, 2),
--   ALTER COLUMN film_price TYPE DECIMAL(12, 2);
--
-- -- Section 2: Remove agent columns from audit_logs
-- DROP INDEX IF EXISTS idx_audit_logs_agent;
-- ALTER TABLE audit_logs DROP COLUMN IF EXISTS changes;
-- ALTER TABLE audit_logs DROP COLUMN IF EXISTS agent;
--
-- -- Section 1: Drop payment_items
-- DROP TABLE IF EXISTS payment_items;
--
-- COMMIT;
