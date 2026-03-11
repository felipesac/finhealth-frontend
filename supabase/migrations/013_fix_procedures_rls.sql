-- Fix procedures RLS policies [Story FH-hotfix]
-- Migration 008 may have partially applied: the DROP of the old permissive
-- policy ran but the new role-based policies were not created, leaving
-- procedures with no INSERT/UPDATE/DELETE policy for authenticated users.
--
-- This migration idempotently ensures:
-- 1. The has_write_role() helper exists
-- 2. The created_by column exists (with DEFAULT so existing rows get NULL)
-- 3. Clean INSERT/UPDATE/DELETE policies are in place

-- ============================================
-- 1. Ensure has_write_role() function exists
-- ============================================
CREATE OR REPLACE FUNCTION has_write_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role') IN (
        'admin', 'finance_manager', 'tiss_operator'
      ),
      false
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Add created_by column if missing
-- ============================================
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS created_by UUID DEFAULT auth.uid();

-- ============================================
-- 3. Drop any existing write policies (idempotent)
-- ============================================
DROP POLICY IF EXISTS "Authenticated write" ON procedures;
DROP POLICY IF EXISTS "Role insert" ON procedures;
DROP POLICY IF EXISTS "Role update" ON procedures;
DROP POLICY IF EXISTS "Admin delete" ON procedures;

-- ============================================
-- 4. Create clean write policies
-- ============================================
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
