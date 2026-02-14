import { X509Certificate } from 'node:crypto';
import { createSecureContext, createServer as createTlsServer, type TLSSocket } from 'node:tls';
import { connect as tlsConnect } from 'node:tls';
import { type AddressInfo } from 'node:net';

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
// Certificate extraction via TLS handshake
// ============================================

/**
 * Extract X.509 certificate from a PFX buffer using a local TLS handshake.
 * Creates a temporary TLS server on localhost, connects a client to trigger
 * a handshake, and extracts the server certificate from the connection.
 */
function extractCertViaTls(
  pfxBuffer: Buffer,
  password: string
): Promise<X509Certificate> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      server.close();
      reject(new Error('Timeout'));
    }, 5000);

    const server = createTlsServer({ pfx: pfxBuffer, passphrase: password }, (socket: TLSSocket) => {
      clearTimeout(timer);
      const cert = socket.getCertificate() as { raw?: Buffer } | null;
      socket.destroy();
      server.close();
      if (cert?.raw) {
        resolve(new X509Certificate(cert.raw));
      } else {
        reject(new Error('No certificate in TLS context'));
      }
    });

    server.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      const client = tlsConnect({ host: '127.0.0.1', port, rejectUnauthorized: false }, () => {
        setTimeout(() => client.destroy(), 100);
      });
      client.on('error', () => client.destroy());
    });
  });
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
 * Uses node:tls createSecureContext for password validation and
 * a local TLS handshake to extract the X.509 certificate.
 */
export async function parsePfxCertificate(
  pfxBuffer: Buffer,
  password: string
): Promise<CertificateValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!pfxBuffer || pfxBuffer.length === 0) {
    return { valid: false, certificate: null, errors: ['Arquivo de certificado vazio'], warnings };
  }

  if (!password) {
    return { valid: false, certificate: null, errors: ['Senha do certificado obrigatoria'], warnings };
  }

  // Step 1: Validate PFX and password using tls.createSecureContext
  try {
    createSecureContext({
      pfx: pfxBuffer,
      passphrase: password,
    });
  } catch (err: unknown) {
    const error = err as { message?: string; code?: string };
    const msg = error.message || '';
    if (
      msg.includes('mac verify failure') ||
      msg.includes('INCORRECT_PASSWORD') ||
      error.code === 'ERR_OSSL_PKCS12_MAC_VERIFY_FAILURE'
    ) {
      return { valid: false, certificate: null, errors: ['Senha do certificado incorreta'], warnings };
    }
    return {
      valid: false,
      certificate: null,
      errors: [`Falha ao ler certificado: ${msg || 'Formato PFX/P12 invalido'}`],
      warnings,
    };
  }

  // Step 2: Extract X.509 certificate via local TLS handshake
  let x509: X509Certificate;
  try {
    x509 = await extractCertViaTls(pfxBuffer, password);
  } catch {
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
  const hasPrivateKey = true; // createSecureContext succeeded with PFX = private key is present
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
