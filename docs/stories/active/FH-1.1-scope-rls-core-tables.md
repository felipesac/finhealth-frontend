# Story FH-1.1: Multi-tenant RLS with organization isolation

**Epic:** FINHEALTH-EPIC-1 (Brownfield Remediation)
**Sprint:** 1 — Security Hardening
**Points:** 13
**Priority:** Critical
**Status:** Ready for Development
**Agent:** @data-engineer + @dev
**Quality Gate:** @architect

---

## Context

The Brownfield Discovery (Phase 2 finding C1) revealed that `medical_accounts`, `procedures`, `glosas`, and `payments` have RLS policies allowing ANY authenticated user full CRUD access to ALL records:

```sql
CREATE POLICY "Authenticated write" ON medical_accounts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

This means RBAC is enforced only at the API level. If any API route has a bug, or if a user accesses Supabase directly via the anon key, they can read/modify any record.

### Architectural Decision (2026-02-14)

**Decision: Multi-tenant with organization hierarchy (Option B+)**

FinHealth will be sold as SaaS to multiple hospitals, UBS, and clinics. Each client has different integration needs (eSUS only, hospital management system without financial module, etc.). This requires full organization-level data isolation.

## Acceptance Criteria

### Phase 1: Organization Infrastructure

- [ ] Create `organizations` table:
  ```sql
  CREATE TABLE organizations (
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
  ```
- [ ] Create `organization_members` table:
  ```sql
  CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'billing', 'auditor', 'viewer')),
    invited_at TIMESTAMPTZ DEFAULT now(),
    accepted_at TIMESTAMPTZ,
    UNIQUE(user_id, organization_id)
  );
  ```
- [ ] Create helper function `user_org_ids()`:
  ```sql
  CREATE FUNCTION user_org_ids() RETURNS SETOF UUID AS $$
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  $$ LANGUAGE sql SECURITY DEFINER STABLE;
  ```

### Phase 2: Core Tables Migration

- [ ] Add `organization_id UUID NOT NULL` column to `medical_accounts`, `procedures`, `glosas`, `payments`
- [ ] Add FK constraint referencing `organizations(id)` on each
- [ ] Create default organization and backfill `organization_id` on existing records
- [ ] Assign existing users to default organization via `organization_members`
- [ ] Add index on `organization_id` for each core table

### Phase 3: RLS Policies

- [ ] Drop existing permissive RLS policies on 4 core tables
- [ ] Create new RLS policies scoped by organization membership:
  ```sql
  CREATE POLICY "org_isolation_select" ON medical_accounts
    FOR SELECT TO authenticated
    USING (organization_id IN (SELECT user_org_ids()));

  CREATE POLICY "org_isolation_insert" ON medical_accounts
    FOR INSERT TO authenticated
    WITH CHECK (organization_id IN (SELECT user_org_ids()));

  CREATE POLICY "org_isolation_update" ON medical_accounts
    FOR UPDATE TO authenticated
    USING (organization_id IN (SELECT user_org_ids()));

  CREATE POLICY "org_isolation_delete" ON medical_accounts
    FOR DELETE TO authenticated
    USING (organization_id IN (SELECT user_org_ids()));
  ```
- [ ] Apply same pattern to `procedures`, `glosas`, `payments`
- [ ] Super-admin bypass via `is_admin()` function (existing)
- [ ] RLS on `organizations` (members can see their own orgs)
- [ ] RLS on `organization_members` (admins manage, users see own)

### Phase 4: API Integration

- [ ] All 32+ API routes continue to work correctly with new RLS
- [ ] API routes that create records must include `organization_id` from user context
- [ ] Create helper `getUserOrganization()` that returns current user's active org
- [ ] Admin views (cross-org) work via `is_admin()` bypass
- [ ] Supabase client respects new RLS automatically

### Phase 5: Testing

- [ ] Write migration file `008_multi_tenant_organizations.sql`
- [ ] All existing tests pass
- [ ] Add RLS-specific tests: user A cannot see org B data
- [ ] Add RLS-specific tests: admin can see all orgs
- [ ] Add organization CRUD tests
- [ ] Add member invitation/role tests

## Technical Notes

- `user_org_ids()` as SECURITY DEFINER + STABLE ensures efficient RLS evaluation
- Procedures have FK CASCADE from medical_accounts — `organization_id` must be consistent
- `patients` and `health_insurers` also need `organization_id` (reference tables, covered in FH-1.2 update)
- JWT custom claims can cache `organization_id` for performance (future optimization)
- API routes use `createClient()` which respects RLS — scoping is automatic once policies are in place

## Files to Modify

- `supabase/migrations/008_multi_tenant_organizations.sql` (NEW)
- `src/lib/supabase/helpers.ts` (NEW — `getUserOrganization()`)
- `src/types/index.ts` or `src/types/database.ts` (ADD Organization types)
- API routes that create records (add `organization_id` to inserts)
- Test files for affected API routes

## Definition of Done

- [ ] Migration applied successfully
- [ ] Organizations table created with seed data
- [ ] RLS scoping verified: user in org A cannot see org B data
- [ ] Admin user can still see all records across orgs
- [ ] All 32+ API routes tested with scoped user
- [ ] `npm test` passes
- [ ] `npm run typecheck` passes
- [ ] No performance regression on dashboard queries

## Risk Assessment

**Risk Level: HIGH** — Touches all core tables and every API route.

**Mitigation:**
- Deploy migration in a maintenance window
- Keep old policies as fallback (commented out in migration)
- Test with production data clone before applying
- Rollback script included in migration file
