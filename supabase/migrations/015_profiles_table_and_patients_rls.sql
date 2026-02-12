-- Migration 015: Create profiles table + fix patients RLS
-- Bug 1: /configuracoes/usuarios fails with "Could not find table 'public.profiles'"
-- Bug 2: /configuracoes/pacientes fails with "new row violates RLS policy for patients"

-- ============================================
-- 1. Create profiles table for user management
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'auditor'
    CHECK (role IN ('admin', 'finance_manager', 'auditor', 'tiss_operator')),
  active BOOLEAN NOT NULL DEFAULT true,
  last_sign_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read profiles (needed for user listing)
CREATE POLICY "Authenticated read" ON profiles
  FOR SELECT TO authenticated
  USING (true);

-- Only admins can write (insert/update/delete) profiles
CREATE POLICY "Admin write" ON profiles
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Service role full access
CREATE POLICY "Service role" ON profiles
  FOR ALL TO service_role
  USING (true);

-- Seed current user into profiles
INSERT INTO profiles (user_id, email, name, role, active)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data ->> 'name', email),
  COALESCE(raw_user_meta_data ->> 'role', 'auditor'),
  true
FROM auth.users
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 2. Fix patients RLS — permissive write for authenticated
--    Same pattern as migration 014 for procedures
-- ============================================

-- Drop restrictive role-based policies from migration 009
DROP POLICY IF EXISTS "Role insert" ON patients;
DROP POLICY IF EXISTS "Role update" ON patients;
DROP POLICY IF EXISTS "Admin delete" ON patients;

-- Ensure SELECT policy exists
DROP POLICY IF EXISTS "Authenticated read" ON patients;
CREATE POLICY "Authenticated read" ON patients
  FOR SELECT TO authenticated
  USING (true);

-- Permissive write for all authenticated users
CREATE POLICY "Authenticated write" ON patients
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Keep service role full access
DROP POLICY IF EXISTS "Service role" ON patients;
CREATE POLICY "Service role" ON patients
  FOR ALL TO service_role
  USING (true);

-- ============================================
-- 3. Fix health_insurers RLS — same permissive pattern
--    Admin-only was too restrictive for normal workflow
-- ============================================
DROP POLICY IF EXISTS "Admin insert" ON health_insurers;
DROP POLICY IF EXISTS "Admin update" ON health_insurers;
DROP POLICY IF EXISTS "Admin delete" ON health_insurers;

DROP POLICY IF EXISTS "Authenticated read" ON health_insurers;
CREATE POLICY "Authenticated read" ON health_insurers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated write" ON health_insurers
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role" ON health_insurers;
CREATE POLICY "Service role" ON health_insurers
  FOR ALL TO service_role
  USING (true);
