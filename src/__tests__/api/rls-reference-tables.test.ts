import { describe, it, expect } from 'vitest';
import { hasPermission } from '@/lib/rbac';
import type { UserRole } from '@/lib/rbac';

/**
 * FH-1.2: Verify RBAC permissions that back the RLS write policies
 * on reference tables (patients, health_insurers).
 *
 * DB-level enforcement:
 *   patients  — has_write_role() → admin + finance_manager can INSERT/UPDATE
 *               is_admin()       → admin-only DELETE
 *   health_insurers — is_admin() → admin-only INSERT/UPDATE/DELETE
 *
 * RBAC mapping:
 *   accounts:write  → patients write access
 *   settings:write  → health_insurers write access (API gate)
 *   admin:all       → delete on both tables (DB gate)
 */

const ALL_ROLES: UserRole[] = ['admin', 'finance_manager', 'auditor', 'tiss_operator'];

describe('RLS reference tables — RBAC permission mapping', () => {
  describe('patients write access (accounts:write)', () => {
    it('admin has accounts:write', () => {
      expect(hasPermission('admin', 'accounts:write')).toBe(true);
    });

    it('finance_manager has accounts:write', () => {
      expect(hasPermission('finance_manager', 'accounts:write')).toBe(true);
    });

    it('auditor does NOT have accounts:write', () => {
      expect(hasPermission('auditor', 'accounts:write')).toBe(false);
    });

    it('tiss_operator does NOT have accounts:write', () => {
      expect(hasPermission('tiss_operator', 'accounts:write')).toBe(false);
    });
  });

  describe('health_insurers write access (settings:write)', () => {
    it('admin has settings:write', () => {
      expect(hasPermission('admin', 'settings:write')).toBe(true);
    });

    it('finance_manager has settings:write (API-level, blocked by RLS at DB)', () => {
      expect(hasPermission('finance_manager', 'settings:write')).toBe(true);
    });

    it('auditor does NOT have settings:write', () => {
      expect(hasPermission('auditor', 'settings:write')).toBe(false);
    });

    it('tiss_operator does NOT have settings:write', () => {
      expect(hasPermission('tiss_operator', 'settings:write')).toBe(false);
    });
  });

  describe('delete access (admin:all)', () => {
    it('only admin has admin:all', () => {
      for (const role of ALL_ROLES) {
        if (role === 'admin') {
          expect(hasPermission(role, 'admin:all')).toBe(true);
        } else {
          expect(hasPermission(role, 'admin:all')).toBe(false);
        }
      }
    });
  });

  describe('read-only roles cannot write to either table', () => {
    const readOnlyRoles: UserRole[] = ['auditor', 'tiss_operator'];

    for (const role of readOnlyRoles) {
      it(`${role} cannot write patients (no accounts:write)`, () => {
        expect(hasPermission(role, 'accounts:write')).toBe(false);
      });

      it(`${role} cannot write health_insurers (no settings:write)`, () => {
        expect(hasPermission(role, 'settings:write')).toBe(false);
      });

      it(`${role} cannot delete from either table (no admin:all)`, () => {
        expect(hasPermission(role, 'admin:all')).toBe(false);
      });
    }
  });
});
