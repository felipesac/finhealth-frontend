import type { SupabaseClient } from '@supabase/supabase-js';
import { getUserOrganizationId } from '@/lib/supabase/helpers';

export type UserRole = 'admin' | 'finance_manager' | 'auditor' | 'tiss_operator';

export type Permission =
  | 'accounts:read' | 'accounts:write'
  | 'glosas:read' | 'glosas:write'
  | 'appeals:read' | 'appeals:write'
  | 'payments:read' | 'payments:write'
  | 'reconcile:write'
  | 'tiss:read' | 'tiss:write'
  | 'export:read'
  | 'reports:read'
  | 'settings:read' | 'settings:write'
  | 'audit:read'
  | 'notifications:read' | 'notifications:write'
  | 'certificates:read' | 'certificates:write'
  | 'sus:read' | 'sus:write'
  | 'squad:billing:read' | 'squad:billing:write'
  | 'squad:audit:read' | 'squad:audit:write'
  | 'squad:reconciliation:read' | 'squad:reconciliation:write'
  | 'squad:cashflow:read' | 'squad:cashflow:write'
  | 'squad:route:write'
  | 'admin:all';

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  admin: ['admin:all'],
  finance_manager: [
    'accounts:read', 'accounts:write',
    'glosas:read', 'glosas:write',
    'appeals:read', 'appeals:write',
    'payments:read', 'payments:write',
    'reconcile:write',
    'tiss:read', 'tiss:write',
    'export:read',
    'reports:read',
    'settings:read', 'settings:write',
    'notifications:read', 'notifications:write',
    'certificates:read', 'certificates:write',
    'sus:read', 'sus:write',
    'squad:billing:read', 'squad:billing:write',
    'squad:audit:read', 'squad:audit:write',
    'squad:reconciliation:read', 'squad:reconciliation:write',
    'squad:cashflow:read', 'squad:cashflow:write',
    'squad:route:write',
  ],
  auditor: [
    'accounts:read',
    'glosas:read',
    'appeals:read',
    'payments:read',
    'export:read',
    'reports:read',
    'audit:read',
    'notifications:read',
    'squad:audit:read', 'squad:audit:write',
    'squad:billing:read',
    'squad:reconciliation:read',
    'squad:cashflow:read',
  ],
  tiss_operator: [
    'accounts:read',
    'tiss:read', 'tiss:write',
    'notifications:read',
    'squad:billing:read', 'squad:billing:write',
  ],
};

/**
 * Get the user role from Supabase auth metadata.
 * Falls back to 'finance_manager' if no role is set (backwards compatible).
 */
export async function getUserRole(supabase: SupabaseClient): Promise<{
  userId: string;
  email: string;
  role: UserRole;
} | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const role = (user.user_metadata?.role as UserRole) || 'finance_manager';

  return {
    userId: user.id,
    email: user.email || '',
    role,
  };
}

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes('admin:all') || perms.includes(permission);
}

/**
 * Require authentication + permission. Returns user info with org context or null.
 */
export async function requirePermission(
  supabase: SupabaseClient,
  permission: Permission
): Promise<{ userId: string; email: string; role: UserRole; organizationId: string } | null> {
  const userInfo = await getUserRole(supabase);
  if (!userInfo) return null;
  if (!hasPermission(userInfo.role, permission)) return null;

  const organizationId = await getUserOrganizationId(supabase);
  if (!organizationId) return null;

  return { ...userInfo, organizationId };
}

/**
 * Check auth + RBAC for API routes. Returns user info with org context or an
 * error object with the appropriate HTTP status (401 = not authenticated,
 * 403 = forbidden or no organization).
 */
export async function checkPermission(
  supabase: SupabaseClient,
  permission: Permission
): Promise<
  | { authorized: true; userId: string; email: string; role: UserRole; organizationId: string }
  | { authorized: false; status: 401 | 403; error: string }
> {
  const userInfo = await getUserRole(supabase);
  if (!userInfo) {
    return { authorized: false, status: 401, error: 'Nao autorizado' };
  }
  if (!hasPermission(userInfo.role, permission)) {
    return { authorized: false, status: 403, error: 'Permissao insuficiente' };
  }

  const organizationId = await getUserOrganizationId(supabase);
  if (!organizationId) {
    return { authorized: false, status: 403, error: 'Usuario sem organizacao associada' };
  }

  return { authorized: true, ...userInfo, organizationId };
}
