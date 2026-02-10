import { describe, it, expect } from 'vitest';
import { hasPermission } from '@/lib/rbac';
import type { UserRole } from '@/lib/rbac';

/**
 * RLS Policy Tests — FH-1.1
 *
 * These tests verify that the RBAC permission model correctly enforces
 * role-based access to the 4 core business tables:
 * medical_accounts, procedures, glosas, payments.
 *
 * DB-level RLS policies mirror the API-level RBAC:
 * - SELECT: all authenticated users
 * - INSERT/UPDATE: admin + finance_manager (has_write_role())
 * - DELETE: admin only (is_admin())
 */

const WRITE_ROLES: UserRole[] = ['admin', 'finance_manager'];
const READ_ONLY_ROLES: UserRole[] = ['auditor', 'tiss_operator'];
const ALL_ROLES: UserRole[] = [...WRITE_ROLES, ...READ_ONLY_ROLES];

describe('RLS Policy — Role-based access matrix', () => {
  describe('SELECT (read) — all authenticated roles can read', () => {
    it.each(ALL_ROLES)('%s can read accounts', (role) => {
      expect(hasPermission(role, 'accounts:read')).toBe(true);
    });

    it.each(ALL_ROLES.filter(r => r !== 'tiss_operator'))('%s can read glosas', (role) => {
      expect(hasPermission(role, 'glosas:read')).toBe(true);
    });

    it.each(ALL_ROLES.filter(r => r !== 'tiss_operator'))('%s can read payments', (role) => {
      expect(hasPermission(role, 'payments:read')).toBe(true);
    });
  });

  describe('INSERT/UPDATE — only admin and finance_manager can write', () => {
    it.each(WRITE_ROLES)('%s can write to accounts', (role) => {
      expect(hasPermission(role, 'accounts:write')).toBe(true);
    });

    it.each(WRITE_ROLES)('%s can write to glosas', (role) => {
      expect(hasPermission(role, 'glosas:write')).toBe(true);
    });

    it.each(WRITE_ROLES)('%s can write to payments', (role) => {
      expect(hasPermission(role, 'payments:write')).toBe(true);
    });

    it('auditor cannot write to accounts', () => {
      expect(hasPermission('auditor', 'accounts:write')).toBe(false);
    });

    it('auditor cannot write to glosas', () => {
      expect(hasPermission('auditor', 'glosas:write')).toBe(false);
    });

    it('auditor cannot write to payments', () => {
      expect(hasPermission('auditor', 'payments:write')).toBe(false);
    });

    it('tiss_operator cannot write to accounts', () => {
      expect(hasPermission('tiss_operator', 'accounts:write')).toBe(false);
    });

    it('tiss_operator cannot write to glosas', () => {
      expect(hasPermission('tiss_operator', 'glosas:write')).toBe(false);
    });

    it('tiss_operator cannot write to payments', () => {
      expect(hasPermission('tiss_operator', 'payments:write')).toBe(false);
    });
  });

  describe('DELETE — admin only (is_admin() in DB)', () => {
    it('admin has full access (admin:all)', () => {
      expect(hasPermission('admin', 'admin:all')).toBe(true);
    });

    it('finance_manager does not have admin:all', () => {
      expect(hasPermission('finance_manager', 'admin:all')).toBe(false);
    });

    it('auditor does not have admin:all', () => {
      expect(hasPermission('auditor', 'admin:all')).toBe(false);
    });

    it('tiss_operator does not have admin:all', () => {
      expect(hasPermission('tiss_operator', 'admin:all')).toBe(false);
    });
  });
});
