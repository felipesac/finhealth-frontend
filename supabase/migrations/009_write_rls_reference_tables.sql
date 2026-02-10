-- FH-1.2: Add Write RLS Policies for Reference Tables
-- patients: admin + finance_manager can INSERT/UPDATE, admin-only DELETE
-- health_insurers: admin-only for all writes
-- SELECT remains open to all authenticated users (unchanged).
-- Service role policies remain FOR ALL (unchanged).

-- ============================================
-- 1. patients — write policies
-- ============================================
CREATE POLICY "Role insert" ON patients
  FOR INSERT TO authenticated
  WITH CHECK (has_write_role());

CREATE POLICY "Role update" ON patients
  FOR UPDATE TO authenticated
  USING (has_write_role())
  WITH CHECK (has_write_role());

CREATE POLICY "Admin delete" ON patients
  FOR DELETE TO authenticated
  USING (is_admin());

-- ============================================
-- 2. health_insurers — admin-only write policies
-- ============================================
CREATE POLICY "Admin insert" ON health_insurers
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admin update" ON health_insurers
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin delete" ON health_insurers
  FOR DELETE TO authenticated
  USING (is_admin());
