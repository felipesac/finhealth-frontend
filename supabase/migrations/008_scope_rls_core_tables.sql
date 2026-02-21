-- FH-1.1: Scope RLS Policies on Core Business Tables
-- Replaces overly-permissive "Authenticated write" policies with role-based access.
-- SELECT remains open to all authenticated users (healthcare collaborative workflow).
-- INSERT/UPDATE restricted to admin + finance_manager. DELETE restricted to admin.

-- ============================================
-- 1. Helper function: has_write_role()
-- ============================================
CREATE OR REPLACE FUNCTION has_write_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'finance_manager'),
      false
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Add created_by column to core tables
-- ============================================
ALTER TABLE medical_accounts ADD COLUMN IF NOT EXISTS created_by UUID DEFAULT auth.uid();
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS created_by UUID DEFAULT auth.uid();
ALTER TABLE glosas ADD COLUMN IF NOT EXISTS created_by UUID DEFAULT auth.uid();
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_by UUID DEFAULT auth.uid();

-- ============================================
-- 3. Drop overly-permissive write policies
-- ============================================
DROP POLICY IF EXISTS "Authenticated write" ON medical_accounts;
DROP POLICY IF EXISTS "Authenticated write" ON procedures;
DROP POLICY IF EXISTS "Authenticated write" ON glosas;
DROP POLICY IF EXISTS "Authenticated write" ON payments;

-- ============================================
-- 4. Create role-based write policies
-- ============================================

-- medical_accounts
CREATE POLICY "Role insert" ON medical_accounts
  FOR INSERT TO authenticated
  WITH CHECK (has_write_role());

CREATE POLICY "Role update" ON medical_accounts
  FOR UPDATE TO authenticated
  USING (has_write_role())
  WITH CHECK (has_write_role());

CREATE POLICY "Admin delete" ON medical_accounts
  FOR DELETE TO authenticated
  USING (is_admin());

-- procedures
CREATE POLICY "Role insert" ON procedures
  FOR INSERT TO authenticated
  WITH CHECK (has_write_role());

CREATE POLICY "Role update" ON procedures
  FOR UPDATE TO authenticated
  USING (has_write_role())
  WITH CHECK (has_write_role());

CREATE POLICY "Admin delete" ON procedures
  FOR DELETE TO authenticated
  USING (is_admin());

-- glosas
CREATE POLICY "Role insert" ON glosas
  FOR INSERT TO authenticated
  WITH CHECK (has_write_role());

CREATE POLICY "Role update" ON glosas
  FOR UPDATE TO authenticated
  USING (has_write_role())
  WITH CHECK (has_write_role());

CREATE POLICY "Admin delete" ON glosas
  FOR DELETE TO authenticated
  USING (is_admin());

-- payments
CREATE POLICY "Role insert" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (has_write_role());

CREATE POLICY "Role update" ON payments
  FOR UPDATE TO authenticated
  USING (has_write_role())
  WITH CHECK (has_write_role());

CREATE POLICY "Admin delete" ON payments
  FOR DELETE TO authenticated
  USING (is_admin());
