-- ============================================================================
-- FH-1.2: Patient Org-Scoping + Audit Log Organization Context
-- ============================================================================
-- Extends migration 016 (multi-tenant) to cover patients and audit_logs tables.
--
-- Patients table currently has permissive RLS (USING true) which allows any
-- authenticated user to see ALL patients across ALL organizations.
-- This migration adds organization_id, backfills to default org, and
-- replaces permissive RLS with org-scoped policies.
--
-- Also adds organization_id to audit_logs for LGPD compliance.
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1: Patients — Add organization_id
-- ============================================================================

-- 1.1 Add column with default for backfill
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS organization_id UUID
  DEFAULT '00000000-0000-0000-0000-000000000001'
  REFERENCES organizations(id);

-- 1.2 Backfill existing rows
UPDATE patients
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

-- 1.3 Set NOT NULL constraint
ALTER TABLE patients ALTER COLUMN organization_id SET NOT NULL;

-- 1.4 Remove default (new inserts must provide org explicitly)
ALTER TABLE patients ALTER COLUMN organization_id DROP DEFAULT;

-- 1.5 Indexes
CREATE INDEX IF NOT EXISTS idx_patients_org ON patients(organization_id);
CREATE INDEX IF NOT EXISTS idx_patients_org_name ON patients(organization_id, name);
CREATE INDEX IF NOT EXISTS idx_patients_org_cpf ON patients(organization_id, cpf);

-- ============================================================================
-- PHASE 2: Patients — Replace Permissive RLS with Org-Scoped
-- ============================================================================

-- 2.1 Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated read" ON patients;
DROP POLICY IF EXISTS "Authenticated write" ON patients;
DROP POLICY IF EXISTS "Service role" ON patients;

-- 2.2 Org-scoped read: members of the same org can view patients
CREATE POLICY "Org read" ON patients
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT user_org_ids()) OR is_admin());

-- 2.3 Org-scoped insert: admin or billing role within the org
CREATE POLICY "Org insert" ON patients
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT user_org_ids())
    AND user_org_role(organization_id) IN ('admin', 'billing')
  );

-- 2.4 Org-scoped update: admin or billing role within the org
CREATE POLICY "Org update" ON patients
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT user_org_ids())
    AND user_org_role(organization_id) IN ('admin', 'billing')
  );

-- 2.5 Org-scoped delete: admin only
CREATE POLICY "Org delete" ON patients
  FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT user_org_ids())
    AND user_org_role(organization_id) = 'admin'
  );

-- 2.6 Service role: full access for squad agents
CREATE POLICY "Service role" ON patients
  FOR ALL TO service_role
  USING (true);

-- ============================================================================
-- PHASE 3: Audit Logs — Add organization_id for LGPD compliance
-- ============================================================================

-- 3.1 Add organization_id column (nullable — legacy entries won't have it)
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 3.2 Index for org-scoped audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_action ON audit_logs(organization_id, action);

-- 3.3 Backfill existing audit entries from user's org membership
UPDATE audit_logs al
SET organization_id = (
  SELECT om.organization_id
  FROM organization_members om
  WHERE om.user_id = al.user_id
  LIMIT 1
)
WHERE al.organization_id IS NULL;

COMMIT;

-- ============================================================================
-- ROLLBACK SCRIPT (run manually if needed)
-- ============================================================================
-- BEGIN;
--
-- -- Restore permissive policies on patients
-- DROP POLICY IF EXISTS "Org read" ON patients;
-- DROP POLICY IF EXISTS "Org insert" ON patients;
-- DROP POLICY IF EXISTS "Org update" ON patients;
-- DROP POLICY IF EXISTS "Org delete" ON patients;
-- DROP POLICY IF EXISTS "Service role" ON patients;
--
-- CREATE POLICY "Authenticated read" ON patients
--   FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "Authenticated write" ON patients
--   FOR ALL TO authenticated USING (true) WITH CHECK (true);
--
-- -- Drop columns
-- ALTER TABLE patients DROP COLUMN IF EXISTS organization_id;
-- ALTER TABLE audit_logs DROP COLUMN IF EXISTS organization_id;
--
-- COMMIT;
