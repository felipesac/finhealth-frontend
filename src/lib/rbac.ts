import type { SupabaseClient } from '@supabase/supabase-js';

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
  ],
  tiss_operator: [
    'accounts:read',
    'tiss:read', 'tiss:write',
    'notifications:read',
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
 * Require authentication + permission. Returns user info or null.
 */
export async function requirePermission(
  supabase: SupabaseClient,
  permission: Permission
): Promise<{ userId: string; email: string; role: UserRole } | null> {
  const userInfo = await getUserRole(supabase);
  if (!userInfo) return null;
  if (!hasPermission(userInfo.role, permission)) return null;
  return userInfo;
}

/**
 * Check auth + RBAC for API routes. Returns user info or an error object
 * with the appropriate HTTP status (401 = not authenticated, 403 = forbidden).
 */
export async function checkPermission(
  supabase: SupabaseClient,
  permission: Permission
): Promise<
  | { authorized: true; userId: string; email: string; role: UserRole }
  | { authorized: false; status: 401 | 403; error: string }
> {
  const userInfo = await getUserRole(supabase);
  if (!userInfo) {
    return { authorized: false, status: 401, error: 'Nao autorizado' };
  }
  if (!hasPermission(userInfo.role, permission)) {
    return { authorized: false, status: 403, error: 'Permissao insuficiente' };
  }
  return { authorized: true, ...userInfo };
}
