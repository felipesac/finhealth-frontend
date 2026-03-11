import { describe, it, expect } from 'vitest';
import { isValidCPF, isValidCNPJ, isValidCNES, isValidCBO, isValidANS, formatCPF, formatCNPJ } from './validators';

describe('isValidCPF', () => {
  it('validates correct CPF', () => {
    expect(isValidCPF('529.982.247-25')).toBe(true);
    expect(isValidCPF('52998224725')).toBe(true);
  });

  it('rejects invalid CPF', () => {
    expect(isValidCPF('111.111.111-11')).toBe(false);
    expect(isValidCPF('123.456.789-00')).toBe(false);
    expect(isValidCPF('123')).toBe(false);
    expect(isValidCPF('')).toBe(false);
  });
});

describe('isValidCNPJ', () => {
  it('validates correct CNPJ', () => {
    expect(isValidCNPJ('11.222.333/0001-81')).toBe(true);
    expect(isValidCNPJ('11222333000181')).toBe(true);
  });

  it('rejects invalid CNPJ', () => {
    expect(isValidCNPJ('11.111.111/1111-11')).toBe(false);
    expect(isValidCNPJ('12.345.678/0001-00')).toBe(false);
    expect(isValidCNPJ('123')).toBe(false);
  });
});

describe('isValidCNES', () => {
  it('validates 7-digit CNES', () => {
    expect(isValidCNES('1234567')).toBe(true);
  });
  it('rejects invalid CNES', () => {
    expect(isValidCNES('123')).toBe(false);
    expect(isValidCNES('12345678')).toBe(false);
  });
});

describe('isValidCBO', () => {
  it('validates 6-digit CBO', () => {
    expect(isValidCBO('225125')).toBe(true);
  });
  it('rejects invalid CBO', () => {
    expect(isValidCBO('12345')).toBe(false);
  });
});

describe('isValidANS', () => {
  it('validates 6-digit ANS', () => {
    expect(isValidANS('123456')).toBe(true);
  });
  it('rejects invalid ANS', () => {
    expect(isValidANS('12345')).toBe(false);
  });
});

describe('formatCPF', () => {
  it('formats CPF correctly', () => {
    expect(formatCPF('52998224725')).toBe('529.982.247-25');
  });
});

describe('formatCNPJ', () => {
  it('formats CNPJ correctly', () => {
    expect(formatCNPJ('11222333000181')).toBe('11.222.333/0001-81');
  });
});
