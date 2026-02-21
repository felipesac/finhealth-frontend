import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatDate, formatDateTime, formatRelative } from './date';

describe('formatDate', () => {
  it('formats ISO string to dd/MM/yyyy', () => {
    expect(formatDate('2024-03-15T10:30:00Z')).toBe('15/03/2024');
  });

  it('formats Date object', () => {
    expect(formatDate(new Date(2024, 0, 1))).toBe('01/01/2024');
  });
});

describe('formatDateTime', () => {
  it('formats ISO string with time', () => {
    const result = formatDateTime('2024-03-15T14:30:00');
    expect(result).toContain('15/03/2024');
    expect(result).toContain('14:30');
  });
});

describe('formatRelative', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Hoje" for today', () => {
    expect(formatRelative(new Date(2024, 5, 15, 8, 0, 0))).toBe('Hoje');
  });

  it('returns "Ontem" for yesterday', () => {
    expect(formatRelative(new Date(2024, 5, 14, 8, 0, 0))).toBe('Ontem');
  });

  it('returns days ago for less than a week', () => {
    expect(formatRelative(new Date(2024, 5, 12, 8, 0, 0))).toBe('3 dias atras');
  });

  it('returns weeks ago for less than a month', () => {
    expect(formatRelative(new Date(2024, 4, 25, 8, 0, 0))).toBe('3 semanas atras');
  });

  it('returns formatted date for older dates', () => {
    const result = formatRelative(new Date(2024, 0, 1));
    expect(result).toBe('01/01/2024');
  });
});
