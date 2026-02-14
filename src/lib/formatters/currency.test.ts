import { describe, it, expect } from 'vitest';
import { formatCurrency, formatNumber } from './currency';

describe('formatCurrency', () => {
  it('formats positive values in BRL', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('1.234,56');
  });

  it('formats zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0,00');
  });

  it('formats negative values', () => {
    const result = formatCurrency(-500);
    expect(result).toContain('500,00');
  });

  it('formats large values', () => {
    const result = formatCurrency(1000000);
    expect(result).toContain('1.000.000,00');
  });
});

describe('formatNumber', () => {
  it('formats integers with thousand separators', () => {
    expect(formatNumber(1234567)).toBe('1.234.567');
  });

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('formats decimals', () => {
    const result = formatNumber(1234.5);
    expect(result).toContain('1.234');
  });
});
