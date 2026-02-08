import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { certificateUploadSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { checkPermission } from '@/lib/rbac';
import { parsePfxCertificate, MAX_CERTIFICATE_SIZE, ALLOWED_CERTIFICATE_EXTENSIONS } from '@/lib/certificate-parser';
import { createHash } from 'node:crypto';

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'cert-upload');
    const { success: allowed } = rateLimit(rlKey, { limit: 5, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'certificates:write');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }
    const user = { id: auth.userId, email: auth.email };

    const body = await request.json();
    const parsed = certificateUploadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { fileName, fileData, password, name } = parsed.data;

    // Validate file extension
    const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
    if (!ALLOWED_CERTIFICATE_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { success: false, error: 'Formato de arquivo invalido. Use .pfx ou .p12' },
        { status: 400 }
      );
    }

    // Decode base64 file data
    let pfxBuffer: Buffer;
    try {
      pfxBuffer = Buffer.from(fileData, 'base64');
    } catch {
      return NextResponse.json(
        { success: false, error: 'Dados do arquivo invalidos' },
        { status: 400 }
      );
    }

    if (pfxBuffer.length > MAX_CERTIFICATE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Arquivo excede o tamanho maximo de 2MB' },
        { status: 400 }
      );
    }

    // Parse and validate certificate
    const result = parsePfxCertificate(pfxBuffer, password);

    if (!result.valid || !result.certificate) {
      return NextResponse.json({
        success: false,
        error: result.errors[0] || 'Certificado invalido',
        errors: result.errors,
        warnings: result.warnings,
      }, { status: 400 });
    }

    const cert = result.certificate;
    const fingerprint = createHash('sha256').update(pfxBuffer).digest('hex');

    // Check for duplicate fingerprint
    const { data: existing } = await supabase
      .from('digital_certificates')
      .select('id')
      .eq('fingerprint', fingerprint)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Este certificado ja foi cadastrado' },
        { status: 409 }
      );
    }

    // Mark any existing active certificate as replaced
    await supabase
      .from('digital_certificates')
      .update({ status: 'replaced' })
      .eq('user_id', user.id)
      .eq('status', 'active');

    // Store certificate
    const { data: inserted, error: insertError } = await supabase
      .from('digital_certificates')
      .insert({
        user_id: user.id,
        name,
        common_name: cert.commonName,
        serial_number: cert.serialNumber,
        issuer: cert.issuer,
        subject: cert.subject,
        valid_from: new Date(cert.validFrom).toISOString(),
        valid_to: new Date(cert.validTo).toISOString(),
        cnpj: cert.cnpj,
        cpf: cert.cpf,
        certificate_type: 'A1',
        status: 'active',
        pfx_data: fileData, // stored as base64 in BYTEA
        file_name: fileName,
        file_size: pfxBuffer.length,
        fingerprint,
      })
      .select('id, name, common_name, valid_from, valid_to, status, created_at')
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: `Falha ao salvar certificado: ${insertError.message}` },
        { status: 500 }
      );
    }

    auditLog(supabase, user.id, {
      action: 'certificate.upload',
      resource: 'digital_certificates',
      resource_id: inserted.id,
      details: {
        commonName: cert.commonName,
        serialNumber: cert.serialNumber,
        validTo: cert.validTo,
        cnpj: cert.cnpj,
        cpf: cert.cpf,
      },
      ip: getClientIp(request),
    });

    return NextResponse.json({
      success: true,
      certificate: inserted,
      warnings: result.warnings,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao processar certificado' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'cert-list');
    const { success: allowed } = rateLimit(rlKey, { limit: 30, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'certificates:read');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { data, error } = await supabase
      .from('digital_certificates')
      .select('id, name, common_name, serial_number, issuer, valid_from, valid_to, cnpj, cpf, certificate_type, status, file_name, file_size, created_at, updated_at')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: `Falha ao buscar certificados: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, certificates: data });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao buscar certificados' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'cert-delete');
    const { success: allowed } = rateLimit(rlKey, { limit: 10, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'certificates:write');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const certId = searchParams.get('id');

    if (!certId) {
      return NextResponse.json(
        { success: false, error: 'ID do certificado obrigatorio' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('digital_certificates')
      .delete()
      .eq('id', certId)
      .eq('user_id', auth.userId);

    if (error) {
      return NextResponse.json(
        { success: false, error: `Falha ao remover certificado: ${error.message}` },
        { status: 500 }
      );
    }

    auditLog(supabase, auth.userId, {
      action: 'certificate.delete',
      resource: 'digital_certificates',
      resource_id: certId,
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao remover certificado' },
      { status: 500 }
    );
  }
}
