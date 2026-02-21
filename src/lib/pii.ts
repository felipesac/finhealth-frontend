/**
 * PII utilities for LGPD compliance.
 * Provides masking functions for sensitive personal data in API responses.
 *
 * LGPD Art. 11: Health data requires additional protection.
 * Default behavior: mask CPF showing only last 4 digits.
 * Admin role may access full CPF when explicitly needed.
 */

/**
 * Mask a CPF string, showing only the last 4 digits.
 *
 * @example
 * maskCpf('123.456.789-01') // → '***.***. 789-01'
 * maskCpf('12345678901')    // → '*******8901'
 * maskCpf(null)             // → null
 */
export function maskCpf(cpf: string | null | undefined): string | null {
  if (!cpf) return null;
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;

  if (cpf.includes('.') || cpf.includes('-')) {
    return `***.***. ${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  return `*******${digits.slice(7)}`;
}

/**
 * Mask PII fields in a single patient-like record.
 * By default masks CPF. Pass `showFullCpf: true` for admin access.
 */
export function maskPatientPii<T extends Record<string, unknown>>(
  record: T,
  opts?: { showFullCpf?: boolean }
): T {
  const masked = { ...record };
  if ('cpf' in masked && !opts?.showFullCpf) {
    (masked as Record<string, unknown>).cpf = maskCpf(masked.cpf as string);
  }
  return masked;
}

/**
 * Mask PII fields in an array of patient-like records.
 */
export function maskPatientsPii<T extends Record<string, unknown>>(
  records: T[],
  opts?: { showFullCpf?: boolean }
): T[] {
  return records.map(r => maskPatientPii(r, opts));
}
