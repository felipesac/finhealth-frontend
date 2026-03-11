/**
 * Validates a Brazilian CPF number (11 digits).
 */
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (parseInt(cleaned[9]) !== check) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  return parseInt(cleaned[10]) === check;
}

/**
 * Validates a Brazilian CNPJ number (14 digits).
 */
export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(cleaned[i]) * weights1[i];
  let check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cleaned[12]) !== check) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(cleaned[i]) * weights2[i];
  check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return parseInt(cleaned[13]) === check;
}

/**
 * Validates a CNES code (7 digits - Cadastro Nacional de Estabelecimentos de Saude).
 */
export function isValidCNES(cnes: string): boolean {
  const cleaned = cnes.replace(/\D/g, '');
  return cleaned.length === 7 && /^\d{7}$/.test(cleaned);
}

/**
 * Validates a CBO code (6 digits - Classificacao Brasileira de Ocupacoes).
 */
export function isValidCBO(cbo: string): boolean {
  const cleaned = cbo.replace(/\D/g, '');
  return cleaned.length === 6 && /^\d{6}$/.test(cleaned);
}

/**
 * Validates an ANS code (6 digits - Agencia Nacional de Saude Suplementar).
 */
export function isValidANS(ans: string): boolean {
  const cleaned = ans.replace(/\D/g, '');
  return cleaned.length === 6 && /^\d{6}$/.test(cleaned);
}

/**
 * Formats a CPF string (000.000.000-00).
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formats a CNPJ string (00.000.000/0000-00).
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}
