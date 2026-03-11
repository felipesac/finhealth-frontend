-- Re-enable RLS on procedures with permissive policies for authenticated users
-- RLS was disabled as a workaround because role-based policies from migrations
-- 008/013 blocked users without admin/finance_manager/tiss_operator metadata role.
-- This migration restores RLS with simple permissive policies.

-- 1. Re-enable RLS (idempotent — no-op if already enabled)
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;

-- 2. Drop restrictive role-based policies
DROP POLICY IF EXISTS "Role insert" ON procedures;
DROP POLICY IF EXISTS "Role update" ON procedures;
DROP POLICY IF EXISTS "Admin delete" ON procedures;

-- 3. Ensure SELECT policy exists
DROP POLICY IF EXISTS "Authenticated read" ON procedures;
CREATE POLICY "Authenticated read" ON procedures
  FOR SELECT TO authenticated
  USING (true);

-- 4. Create permissive write policy for all authenticated users
CREATE POLICY "Authenticated write" ON procedures
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Keep service role full access
DROP POLICY IF EXISTS "Service role" ON procedures;
CREATE POLICY "Service role" ON procedures
  FOR ALL TO service_role
  USING (true);
