-- ============================================================================
-- FH-1.1: Multi-tenant RLS with Organization Isolation
-- ============================================================================
-- Architectural Decision (2026-02-14): Option B+ — Organization hierarchy
-- FinHealth SaaS for hospitals, UBS, and clinics requires org-level isolation.
--
-- This migration:
--   Phase 1: Creates organizations + organization_members tables
--   Phase 2: Adds organization_id to core business tables + backfill
--   Phase 3: Replaces permissive RLS with org-scoped policies
--
-- ROLLBACK: See bottom of file for complete rollback script.
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1: Organization Infrastructure
-- ============================================================================

-- 1.1 Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hospital', 'ubs', 'clinica')),
  plan TEXT NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic', 'professional', 'enterprise')),
  settings JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(active) WHERE active = true;

COMMENT ON TABLE organizations IS 'Multi-tenant: each hospital/UBS/clinic is an organization';
COMMENT ON COLUMN organizations.type IS 'hospital, ubs, or clinica';
COMMENT ON COLUMN organizations.plan IS 'SaaS tier: basic, professional, enterprise';
COMMENT ON COLUMN organizations.settings IS 'Org-specific config: enabled modules, integrations, etc.';

-- 1.2 Organization members table
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'billing', 'auditor', 'viewer')),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);

COMMENT ON TABLE organization_members IS 'Maps users to organizations with roles';
COMMENT ON COLUMN organization_members.role IS 'admin=full access, billing=read+write accounts, auditor=read+audit, viewer=read-only';

-- 1.3 Helper function: user_org_ids()
-- Returns all organization IDs the current user belongs to.
-- SECURITY DEFINER so RLS policies can call it without recursion.
-- STABLE so Postgres can cache within a single statement.
CREATE OR REPLACE FUNCTION user_org_ids()
RETURNS SETOF UUID AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION user_org_ids() IS 'Returns org IDs for the authenticated user — used in RLS policies';

-- 1.4 Helper function: user_org_role(org_id)
-- Returns the user role within a specific organization.
CREATE OR REPLACE FUNCTION user_org_role(org_id UUID)
RETURNS TEXT AS $$
  SELECT role
  FROM organization_members
  WHERE user_id = auth.uid()
    AND organization_id = org_id
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION user_org_role(UUID) IS 'Returns user role within a specific org — used for write permission checks';

-- 1.5 Updated_at trigger for organizations
CREATE TRIGGER set_updated_at_organizations
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 1.6 RLS on organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own orgs" ON organizations
  FOR SELECT TO authenticated
  USING (id IN (SELECT user_org_ids()) OR is_admin());

CREATE POLICY "Admins can manage orgs" ON organizations
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Service role full access" ON organizations
  FOR ALL TO service_role
  USING (true);

-- 1.7 RLS on organization_members
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own memberships" ON organization_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Org admins manage members" ON organization_members
  FOR ALL TO authenticated
  USING (
    is_admin() OR
    user_org_role(organization_id) = 'admin'
  )
  WITH CHECK (
    is_admin() OR
    user_org_role(organization_id) = 'admin'
  );

CREATE POLICY "Service role full access" ON organization_members
  FOR ALL TO service_role
  USING (true);

-- ============================================================================
-- PHASE 2: Add organization_id to Core Business Tables
-- ============================================================================

-- 2.1 Create default organization for existing data
INSERT INTO organizations (id, name, slug, type, plan)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Organizacao Padrao',
  'default',
  'hospital',
  'professional'
)
ON CONFLICT (slug) DO NOTHING;

-- 2.2 Assign all existing users to default organization as admins
INSERT INTO organization_members (user_id, organization_id, role, accepted_at)
SELECT
  id,
  '00000000-0000-0000-0000-000000000001',
  'admin',
  now()
FROM auth.users
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- 2.3 Add organization_id column to core tables
-- Using DEFAULT for backfill, will remove default after backfill.

ALTER TABLE medical_accounts
  ADD COLUMN IF NOT EXISTS organization_id UUID
  DEFAULT '00000000-0000-0000-0000-000000000001'
  REFERENCES organizations(id);

ALTER TABLE procedures
  ADD COLUMN IF NOT EXISTS organization_id UUID
  DEFAULT '00000000-0000-0000-0000-000000000001'
  REFERENCES organizations(id);

ALTER TABLE glosas
  ADD COLUMN IF NOT EXISTS organization_id UUID
  DEFAULT '00000000-0000-0000-0000-000000000001'
  REFERENCES organizations(id);

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS organization_id UUID
  DEFAULT '00000000-0000-0000-0000-000000000001'
  REFERENCES organizations(id);

-- 2.4 Backfill existing rows (if NULL somehow)
UPDATE medical_accounts SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE procedures SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE glosas SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE payments SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

-- 2.5 Set NOT NULL after backfill
ALTER TABLE medical_accounts ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE procedures ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE glosas ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE payments ALTER COLUMN organization_id SET NOT NULL;

-- 2.6 Remove the default (new records must explicitly provide organization_id)
ALTER TABLE medical_accounts ALTER COLUMN organization_id DROP DEFAULT;
ALTER TABLE procedures ALTER COLUMN organization_id DROP DEFAULT;
ALTER TABLE glosas ALTER COLUMN organization_id DROP DEFAULT;
ALTER TABLE payments ALTER COLUMN organization_id DROP DEFAULT;

-- 2.7 Add indexes for org-scoped queries
CREATE INDEX IF NOT EXISTS idx_medical_accounts_org ON medical_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_procedures_org ON procedures(organization_id);
CREATE INDEX IF NOT EXISTS idx_glosas_org ON glosas(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_org ON payments(organization_id);

-- 2.8 Composite indexes for common org-scoped queries
CREATE INDEX IF NOT EXISTS idx_medical_accounts_org_status ON medical_accounts(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_glosas_org_status ON glosas(organization_id, appeal_status);
CREATE INDEX IF NOT EXISTS idx_payments_org_date ON payments(organization_id, payment_date DESC);

-- ============================================================================
-- PHASE 3: Replace Permissive RLS with Org-Scoped Policies
-- ============================================================================

-- -----------------------------------------------
-- 3.1 medical_accounts
-- -----------------------------------------------
DROP POLICY IF EXISTS "Authenticated read" ON medical_accounts;
DROP POLICY IF EXISTS "Authenticated write" ON medical_accounts;
DROP POLICY IF EXISTS "Role insert" ON medical_accounts;
DROP POLICY IF EXISTS "Role update" ON medical_accounts;
DROP POLICY IF EXISTS "Admin delete" ON medical_accounts;
DROP POLICY IF EXISTS "Service role" ON medical_accounts;

CREATE POLICY "Org read" ON medical_accounts
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT user_org_ids()) OR is_admin());

CREATE POLICY "Org insert" ON medical_accounts
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT user_org_ids())
    AND user_org_role(organization_id) IN ('admin', 'billing')
  );

CREATE POLICY "Org update" ON medical_accounts
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT user_org_ids())
    AND user_org_role(organization_id) IN ('admin', 'billing')
  );

CREATE POLICY "Org delete" ON medical_accounts
  FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT user_org_ids())
    AND user_org_role(organization_id) = 'admin'
  );

CREATE POLICY "Service role" ON medical_accounts
  FOR ALL TO service_role
  USING (true);

-- -----------------------------------------------
-- 3.2 procedures
-- -----------------------------------------------
DROP POLICY IF EXISTS "Authenticated read" ON procedures;
DROP POLICY IF EXISTS "Authenticated write" ON procedures;
DROP POLICY IF EXISTS "Role insert" ON procedures;
DROP POLICY IF EXISTS "Role update" ON procedures;
DROP POLICY IF EXISTS "Admin delete" ON procedures;
DROP POLICY IF EXISTS "Service role" ON procedures;

CREATE POLICY "Org read" ON procedures
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT user_org_ids()) OR is_admin());

CREATE POLICY "Org insert" ON procedures
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT user_org_ids())
    AND user_org_role(organization_id) IN ('admin', 'billing')
  );

CREATE POLICY "Org update" ON procedures
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT user_org_ids())
    AND user_org_role(organization_id) IN ('admin', 'billing')
  );

CREATE POLICY "Org delete" ON procedures
  FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT user_org_ids())
    AND user_org_role(organization_id) = 'admin'
  );

CREATE POLICY "Service role" ON procedures
  FOR ALL TO service_role
  USING (true);

-- -----------------------------------------------
-- 3.3 glosas
-- -----------------------------------------------
DROP POLICY IF EXISTS "Authenticated read" ON glosas;
DROP POLICY IF EXISTS "Authenticated write" ON glosas;
DROP POLICY IF EXISTS "Role insert" ON glosas;
DROP POLICY IF EXISTS "Role update" ON glosas;
DROP POLICY IF EXISTS "Admin delete" ON glosas;
DROP POLICY IF EXISTS "Service role" ON glosas;

CREATE POLICY "Org read" ON glosas
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT user_org_ids()) OR is_admin());

CREATE POLICY "Org insert" ON glosas
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT user_org_ids())
    AND user_org_role(organization_id) IN ('admin', 'billing', 'auditor')
  );

CREATE POLICY "Org update" ON glosas
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT user_org_ids())
    AND user_org_role(organization_id) IN ('admin', 'billing', 'auditor')
  );

CREATE POLICY "Org delete" ON glosas
  FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT user_org_ids())
    AND user_org_role(organization_id) = 'admin'
  );

CREATE POLICY "Service role" ON glosas
  FOR ALL TO service_role
  USING (true);

-- -----------------------------------------------
-- 3.4 payments
-- -----------------------------------------------
DROP POLICY IF EXISTS "Authenticated read" ON payments;
DROP POLICY IF EXISTS "Authenticated write" ON payments;
DROP POLICY IF EXISTS "Role insert" ON payments;
DROP POLICY IF EXISTS "Role update" ON payments;
DROP POLICY IF EXISTS "Admin delete" ON payments;
DROP POLICY IF EXISTS "Service role" ON payments;

CREATE POLICY "Org read" ON payments
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT user_org_ids()) OR is_admin());

CREATE POLICY "Org insert" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT user_org_ids())
    AND user_org_role(organization_id) IN ('admin', 'billing')
  );

CREATE POLICY "Org update" ON payments
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT user_org_ids())
    AND user_org_role(organization_id) IN ('admin', 'billing')
  );

CREATE POLICY "Org delete" ON payments
  FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT user_org_ids())
    AND user_org_role(organization_id) = 'admin'
  );

CREATE POLICY "Service role" ON payments
  FOR ALL TO service_role
  USING (true);

COMMIT;

-- ============================================================================
-- ROLLBACK SCRIPT (run manually if needed)
-- ============================================================================
-- BEGIN;
--
-- -- Drop org-scoped policies
-- DROP POLICY IF EXISTS "Org read" ON medical_accounts;
-- DROP POLICY IF EXISTS "Org insert" ON medical_accounts;
-- DROP POLICY IF EXISTS "Org update" ON medical_accounts;
-- DROP POLICY IF EXISTS "Org delete" ON medical_accounts;
-- DROP POLICY IF EXISTS "Service role" ON medical_accounts;
-- DROP POLICY IF EXISTS "Org read" ON procedures;
-- DROP POLICY IF EXISTS "Org insert" ON procedures;
-- DROP POLICY IF EXISTS "Org update" ON procedures;
-- DROP POLICY IF EXISTS "Org delete" ON procedures;
-- DROP POLICY IF EXISTS "Service role" ON procedures;
-- DROP POLICY IF EXISTS "Org read" ON glosas;
-- DROP POLICY IF EXISTS "Org insert" ON glosas;
-- DROP POLICY IF EXISTS "Org update" ON glosas;
-- DROP POLICY IF EXISTS "Org delete" ON glosas;
-- DROP POLICY IF EXISTS "Service role" ON glosas;
-- DROP POLICY IF EXISTS "Org read" ON payments;
-- DROP POLICY IF EXISTS "Org insert" ON payments;
-- DROP POLICY IF EXISTS "Org update" ON payments;
-- DROP POLICY IF EXISTS "Org delete" ON payments;
-- DROP POLICY IF EXISTS "Service role" ON payments;
--
-- -- Restore permissive policies
-- CREATE POLICY "Authenticated read" ON medical_accounts FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "Role insert" ON medical_accounts FOR INSERT TO authenticated WITH CHECK (has_write_role());
-- CREATE POLICY "Role update" ON medical_accounts FOR UPDATE TO authenticated USING (has_write_role()) WITH CHECK (has_write_role());
-- CREATE POLICY "Admin delete" ON medical_accounts FOR DELETE TO authenticated USING (is_admin());
-- -- (repeat for procedures, glosas, payments)
--
-- -- Drop organization_id columns
-- ALTER TABLE medical_accounts DROP COLUMN IF EXISTS organization_id;
-- ALTER TABLE procedures DROP COLUMN IF EXISTS organization_id;
-- ALTER TABLE glosas DROP COLUMN IF EXISTS organization_id;
-- ALTER TABLE payments DROP COLUMN IF EXISTS organization_id;
--
-- -- Drop org tables and functions
-- DROP FUNCTION IF EXISTS user_org_role(UUID);
-- DROP FUNCTION IF EXISTS user_org_ids();
-- DROP TABLE IF EXISTS organization_members;
-- DROP TABLE IF EXISTS organizations;
--
-- COMMIT;
