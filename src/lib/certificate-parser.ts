import { X509Certificate, createPrivateKey, type KeyObject } from 'node:crypto';

// ============================================
// Types
// ============================================

export interface CertificateInfo {
  subject: string;
  issuer: string;
  serialNumber: string;
  validFrom: string;
  validTo: string;
  cnpj: string | null;
  cpf: string | null;
  commonName: string;
  isA1: boolean;
  isExpired: boolean;
  daysUntilExpiry: number;
  hasPrivateKey: boolean;
}

export interface CertificateValidationResult {
  valid: boolean;
  certificate: CertificateInfo | null;
  errors: string[];
  warnings: string[];
}

// ============================================
// Constants
// ============================================

/** Maximum allowed PFX file size (2MB) */
export const MAX_CERTIFICATE_SIZE = 2 * 1024 * 1024;

/** Allowed file extensions for certificate upload */
export const ALLOWED_CERTIFICATE_EXTENSIONS = ['.pfx', '.p12'];

// ============================================
// Minimal DER parser for PKCS#12 cert extraction
// ============================================

function readDerLength(buf: Buffer, offset: number): { length: number; size: number } | null {
  if (offset >= buf.length) return null;
  const b = buf[offset];
  if (b < 0x80) return { length: b, size: 1 };
  const numBytes = b & 0x7f;
  if (numBytes === 0 || offset + 1 + numBytes > buf.length) return null;
  let length = 0;
  for (let i = 0; i < numBytes; i++) {
    length = (length << 8) | buf[offset + 1 + i];
  }
  return { length, size: 1 + numBytes };
}

function readDerElement(buf: Buffer, offset: number): { tag: number; totalSize: number } | null {
  if (offset >= buf.length) return null;
  const tag = buf[offset];
  const lenResult = readDerLength(buf, offset + 1);
  if (!lenResult) return null;
  const totalSize = 1 + lenResult.size + lenResult.length;
  if (offset + totalSize > buf.length) return null;
  return { tag, totalSize };
}

/**
 * Scan a PFX buffer for DER-encoded X.509 certificates.
 * Brazilian ICP-Brasil A1 certificates store the cert in plaintext within the PFX.
 * The private key is the encrypted portion.
 */
function findCertificatesInPfx(pfxBuffer: Buffer): X509Certificate[] {
  const certs: X509Certificate[] = [];

  for (let i = 0; i < pfxBuffer.length - 20; i++) {
    // X.509 certs start with SEQUENCE tag (0x30)
    if (pfxBuffer[i] !== 0x30) continue;

    const elem = readDerElement(pfxBuffer, i);
    // Valid certs are at least ~200 bytes
    if (!elem || elem.totalSize < 200) continue;

    try {
      const candidateDer = pfxBuffer.subarray(i, i + elem.totalSize);
      const cert = new X509Certificate(candidateDer);
      certs.push(cert);
      i += elem.totalSize - 1; // Skip past this cert
    } catch {
      // Not a valid certificate at this position
    }
  }

  return certs;
}

/**
 * Pick the end-entity certificate (not a CA cert) from a list of candidates.
 */
function selectEndEntityCert(certs: X509Certificate[]): X509Certificate | null {
  if (certs.length === 0) return null;
  if (certs.length === 1) return certs[0];

  // Prefer non-CA certificate (the end-entity / leaf cert)
  for (const cert of certs) {
    if (!cert.ca) return cert;
  }

  return certs[0];
}

// ============================================
// Subject field extraction
// ============================================

function extractCommonName(subject: string): string {
  const match = subject.match(/CN=([^,\n]+)/);
  return match ? match[1].trim() : 'Desconhecido';
}

function extractDocuments(subject: string): { cnpj: string | null; cpf: string | null } {
  let cnpj: string | null = null;
  let cpf: string | null = null;

  // ICP-Brasil encodes CNPJ in subject fields
  const cnpjMatch = subject.match(/(\d{14})/);
  if (cnpjMatch) {
    const candidate = cnpjMatch[1];
    // Basic CNPJ validation: 14 digits, not all the same
    if (!/^(\d)\1{13}$/.test(candidate)) {
      cnpj = candidate;
    }
  }

  // CPF: 11 digits
  if (!cnpj) {
    const cpfMatch = subject.match(/(\d{11})/);
    if (cpfMatch) {
      const candidate = cpfMatch[1];
      if (!/^(\d)\1{10}$/.test(candidate)) {
        cpf = candidate;
      }
    }
  }

  return { cnpj, cpf };
}

// ============================================
// Main parsing function
// ============================================

/**
 * Parse a PFX/P12 buffer and extract certificate information.
 * Uses Node.js native crypto module for private key validation
 * and a minimal DER scanner for certificate extraction.
 */
export function parsePfxCertificate(
  pfxBuffer: Buffer,
  password: string
): CertificateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!pfxBuffer || pfxBuffer.length === 0) {
    return { valid: false, certificate: null, errors: ['Arquivo de certificado vazio'], warnings };
  }

  if (!password) {
    return { valid: false, certificate: null, errors: ['Senha do certificado obrigatoria'], warnings };
  }

  // Step 1: Validate password and extract private key info
  let privateKey: KeyObject;
  try {
    // Node.js supports PKCS#12 format since v15.12.0
    // TypeScript types may lag behind runtime support
    privateKey = createPrivateKey({
      key: pfxBuffer,
      format: 'pkcs12' as unknown as 'pem',
      passphrase: password,
    } as Parameters<typeof createPrivateKey>[0]);
  } catch (err: unknown) {
    const error = err as { message?: string; code?: string };
    if (
      error.message?.includes('mac verify failure') ||
      error.code === 'ERR_OSSL_PKCS12_MAC_VERIFY_FAILURE'
    ) {
      return { valid: false, certificate: null, errors: ['Senha do certificado incorreta'], warnings };
    }
    return {
      valid: false,
      certificate: null,
      errors: [`Falha ao ler certificado: ${error.message || 'Formato PFX/P12 invalido'}`],
      warnings,
    };
  }

  const hasPrivateKey = privateKey.type === 'private';

  // Step 2: Extract X.509 certificate from PFX buffer
  const certs = findCertificatesInPfx(pfxBuffer);
  const x509 = selectEndEntityCert(certs);

  if (!x509) {
    return {
      valid: false,
      certificate: null,
      errors: ['Nao foi possivel extrair o certificado X.509 do arquivo PFX'],
      warnings,
    };
  }

  // Step 3: Extract certificate details
  const subject = x509.subject;
  const issuer = x509.issuer;
  const validFrom = x509.validFrom;
  const validTo = x509.validTo;
  const serialNumber = x509.serialNumber;

  const now = new Date();
  const expiryDate = new Date(validTo);
  const startDate = new Date(validFrom);
  const isExpired = now > expiryDate;
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const { cnpj, cpf } = extractDocuments(subject);
  const commonName = extractCommonName(subject);

  // A1 certificates: private key in software (PFX file), validity ~1 year
  const validityDays = Math.ceil((expiryDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const isA1 = hasPrivateKey && validityDays <= 400;

  // Step 4: Validation
  if (isExpired) {
    errors.push(`Certificado expirado em ${expiryDate.toLocaleDateString('pt-BR')}`);
  }

  if (!isA1) {
    errors.push('Certificado nao e do tipo A1. Apenas certificados A1 (arquivo) sao suportados.');
  }

  if (now < startDate) {
    errors.push(`Certificado ainda nao e valido. Inicio: ${startDate.toLocaleDateString('pt-BR')}`);
  }

  if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
    warnings.push(`Certificado expira em ${daysUntilExpiry} dias`);
  } else if (daysUntilExpiry > 30 && daysUntilExpiry <= 60) {
    warnings.push(`Certificado expira em ${daysUntilExpiry} dias. Considere renova-lo.`);
  }

  if (!cnpj && !cpf) {
    warnings.push('Nao foi possivel extrair CNPJ ou CPF do certificado');
  }

  const certificate: CertificateInfo = {
    subject,
    issuer,
    serialNumber,
    validFrom,
    validTo,
    cnpj,
    cpf,
    commonName,
    isA1,
    isExpired,
    daysUntilExpiry,
    hasPrivateKey,
  };

  return {
    valid: errors.length === 0,
    certificate,
    errors,
    warnings,
  };
}
