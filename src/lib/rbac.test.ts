import { describe, it, expect } from 'vitest';
import { hasPermission } from './rbac';
import type { UserRole, Permission } from './rbac';

describe('hasPermission', () => {
  it('admin has all permissions', () => {
    expect(hasPermission('admin', 'accounts:read')).toBe(true);
    expect(hasPermission('admin', 'accounts:write')).toBe(true);
    expect(hasPermission('admin', 'appeals:write')).toBe(true);
    expect(hasPermission('admin', 'audit:read')).toBe(true);
    expect(hasPermission('admin', 'tiss:write')).toBe(true);
  });

  it('finance_manager has broad access', () => {
    expect(hasPermission('finance_manager', 'accounts:read')).toBe(true);
    expect(hasPermission('finance_manager', 'accounts:write')).toBe(true);
    expect(hasPermission('finance_manager', 'appeals:write')).toBe(true);
    expect(hasPermission('finance_manager', 'reconcile:write')).toBe(true);
    expect(hasPermission('finance_manager', 'export:read')).toBe(true);
  });

  it('finance_manager cannot access audit logs', () => {
    expect(hasPermission('finance_manager', 'audit:read')).toBe(false);
  });

  it('auditor has read-only access', () => {
    expect(hasPermission('auditor', 'accounts:read')).toBe(true);
    expect(hasPermission('auditor', 'glosas:read')).toBe(true);
    expect(hasPermission('auditor', 'export:read')).toBe(true);
    expect(hasPermission('auditor', 'audit:read')).toBe(true);
  });

  it('auditor cannot write', () => {
    expect(hasPermission('auditor', 'accounts:write')).toBe(false);
    expect(hasPermission('auditor', 'appeals:write')).toBe(false);
    expect(hasPermission('auditor', 'reconcile:write')).toBe(false);
  });

  it('tiss_operator has limited access', () => {
    expect(hasPermission('tiss_operator', 'tiss:read')).toBe(true);
    expect(hasPermission('tiss_operator', 'tiss:write')).toBe(true);
    expect(hasPermission('tiss_operator', 'accounts:read')).toBe(true);
  });

  it('tiss_operator cannot access finance features', () => {
    expect(hasPermission('tiss_operator', 'appeals:write')).toBe(false);
    expect(hasPermission('tiss_operator', 'reconcile:write')).toBe(false);
    expect(hasPermission('tiss_operator', 'export:read')).toBe(false);
  });

  it('returns false for unknown role', () => {
    expect(hasPermission('unknown' as UserRole, 'accounts:read' as Permission)).toBe(false);
  });
});
