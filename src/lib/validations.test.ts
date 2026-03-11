import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  profileSchema,
  changePasswordSchema,
  appealSchema,
  reconcileSchema,
  exportSchema,
  tissUploadSchema,
} from './validations';

describe('loginSchema', () => {
  it('validates correct input', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: '123456' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'invalid', password: '123456' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('profileSchema', () => {
  it('validates correct name', () => {
    const result = profileSchema.safeParse({ name: 'Joao' });
    expect(result.success).toBe(true);
  });

  it('rejects short name', () => {
    const result = profileSchema.safeParse({ name: 'J' });
    expect(result.success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('validates correct input', () => {
    const result = changePasswordSchema.safeParse({ currentPassword: 'old', newPassword: 'newpwd' });
    expect(result.success).toBe(true);
  });

  it('rejects short new password', () => {
    const result = changePasswordSchema.safeParse({ currentPassword: 'old', newPassword: '12345' });
    expect(result.success).toBe(false);
  });
});

describe('appealSchema', () => {
  it('validates correct appeal', () => {
    const result = appealSchema.safeParse({
      glosaId: '550e8400-e29b-41d4-a716-446655440000',
      text: 'Recurso fundamentado',
      action: 'submit',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID', () => {
    const result = appealSchema.safeParse({
      glosaId: 'not-a-uuid',
      text: 'Recurso',
      action: 'submit',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid action', () => {
    const result = appealSchema.safeParse({
      glosaId: '550e8400-e29b-41d4-a716-446655440000',
      text: 'Recurso',
      action: 'delete',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty text', () => {
    const result = appealSchema.safeParse({
      glosaId: '550e8400-e29b-41d4-a716-446655440000',
      text: '   ',
      action: 'submit',
    });
    expect(result.success).toBe(false);
  });
});

describe('reconcileSchema', () => {
  it('validates correct input', () => {
    const result = reconcileSchema.safeParse({
      paymentId: '550e8400-e29b-41d4-a716-446655440000',
      accountId: '660e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUIDs', () => {
    const result = reconcileSchema.safeParse({
      paymentId: 'bad',
      accountId: 'bad',
    });
    expect(result.success).toBe(false);
  });
});

describe('exportSchema', () => {
  it('validates correct export', () => {
    const result = exportSchema.safeParse({
      types: ['accounts', 'glosas'],
      dateFrom: '2024-01-01',
      dateTo: '2024-12-31',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty types', () => {
    const result = exportSchema.safeParse({ types: [] });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date range', () => {
    const result = exportSchema.safeParse({
      types: ['accounts'],
      dateFrom: '2024-12-31',
      dateTo: '2024-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('allows export without dates', () => {
    const result = exportSchema.safeParse({ types: ['payments'] });
    expect(result.success).toBe(true);
  });
});

describe('tissUploadSchema', () => {
  it('validates correct input', () => {
    const result = tissUploadSchema.safeParse({ xml: '<xml>content</xml>' });
    expect(result.success).toBe(true);
  });

  it('rejects empty xml', () => {
    const result = tissUploadSchema.safeParse({ xml: '' });
    expect(result.success).toBe(false);
  });

  it('allows optional accountId', () => {
    const result = tissUploadSchema.safeParse({ xml: '<xml/>', accountId: '550e8400-e29b-41d4-a716-446655440000' });
    expect(result.success).toBe(true);
  });
});
