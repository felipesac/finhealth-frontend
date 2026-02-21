import { describe, it, expect } from 'vitest';
import { maskCpf, maskPatientPii, maskPatientsPii } from '@/lib/pii';

describe('maskCpf', () => {
  it('masks a formatted CPF showing last 4 digits', () => {
    expect(maskCpf('123.456.789-01')).toBe('***.***. 789-01');
  });

  it('masks an unformatted CPF showing last 4 digits', () => {
    expect(maskCpf('12345678901')).toBe('*******8901');
  });

  it('returns null for null input', () => {
    expect(maskCpf(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(maskCpf(undefined)).toBeNull();
  });

  it('returns as-is for invalid CPF (wrong length)', () => {
    expect(maskCpf('12345')).toBe('12345');
  });

  it('returns as-is for empty string', () => {
    expect(maskCpf('')).toBeNull();
  });

  it('handles CPF with only dots (no dash)', () => {
    expect(maskCpf('123.456.78901')).toBe('***.***. 789-01');
  });
});

describe('maskPatientPii', () => {
  const patient = {
    id: '1',
    name: 'Maria Silva',
    cpf: '123.456.789-01',
    birth_date: '1990-01-15',
  };

  it('masks CPF by default', () => {
    const result = maskPatientPii(patient);
    expect(result.cpf).toBe('***.***. 789-01');
    expect(result.name).toBe('Maria Silva');
    expect(result.id).toBe('1');
  });

  it('shows full CPF when showFullCpf is true', () => {
    const result = maskPatientPii(patient, { showFullCpf: true });
    expect(result.cpf).toBe('123.456.789-01');
  });

  it('does not modify records without cpf field', () => {
    const record = { id: '1', name: 'Test' };
    const result = maskPatientPii(record);
    expect(result).toEqual({ id: '1', name: 'Test' });
  });
});

describe('maskPatientsPii', () => {
  const patients = [
    { id: '1', cpf: '111.222.333-44' },
    { id: '2', cpf: '555.666.777-88' },
  ];

  it('masks CPF in all records', () => {
    const result = maskPatientsPii(patients);
    expect(result[0].cpf).toBe('***.***. 333-44');
    expect(result[1].cpf).toBe('***.***. 777-88');
  });

  it('shows full CPF for all records when showFullCpf is true', () => {
    const result = maskPatientsPii(patients, { showFullCpf: true });
    expect(result[0].cpf).toBe('111.222.333-44');
    expect(result[1].cpf).toBe('555.666.777-88');
  });

  it('handles empty array', () => {
    expect(maskPatientsPii([])).toEqual([]);
  });
});
