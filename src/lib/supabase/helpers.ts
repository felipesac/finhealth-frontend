import type { SupabaseClient } from '@supabase/supabase-js';
import type { Organization, OrganizationMember, OrganizationMemberRole } from '@/types/database';

/**
 * Returns the current user's first organization membership.
 * In SaaS multi-tenant context, users belong to one or more organizations.
 * This returns the first active organization (for single-org users) or
 * can be extended with org-switching for multi-org users.
 */
export async function getUserOrganization(
  supabase: SupabaseClient
): Promise<{ organization: Organization; role: OrganizationMemberRole } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('organization_members')
    .select('role, organization:organizations(*)')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    organization: data.organization as unknown as Organization,
    role: data.role as OrganizationMemberRole,
  };
}

/**
 * Returns the organization_id for the current user.
 * Use this when creating new records that require organization_id.
 */
export async function getUserOrganizationId(
  supabase: SupabaseClient
): Promise<string | null> {
  const result = await getUserOrganization(supabase);
  return result?.organization.id ?? null;
}

/**
 * Returns all organizations the current user belongs to.
 * Used for org-switching UI in multi-org scenarios.
 */
export async function getUserOrganizations(
  supabase: SupabaseClient
): Promise<OrganizationMember[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('organization_members')
    .select('*, organization:organizations(*)')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null);

  if (error || !data) return [];

  return data as unknown as OrganizationMember[];
}
