import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { tissUploadSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { sanitizeXml } from '@/lib/sanitize-xml';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { checkPermission } from '@/lib/rbac';

const MAX_XML_SIZE = 5 * 1024 * 1024; // 5MB

const GUIDE_TYPE_MAP: Record<string, string> = {
  'guiaConsulta': 'consulta',
  'guiaSP-SADT': 'sadt',
  'guiaResumoInternacao': 'internacao',
  'guiaHonorarios': 'honorarios',
};

function parseTissXml(xml: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  guideNumber: string | null;
  guideType: string | null;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for TISS root element
  if (!/<[\w:]*mensagemTISS[\s>]/i.test(xml)) {
    errors.push('Elemento raiz mensagemTISS nao encontrado');
    return { isValid: false, errors, warnings, guideNumber: null, guideType: null };
  }

  // Check for header
  if (!/<[\w:]*cabecalho[\s>]/i.test(xml)) {
    errors.push('Cabecalho TISS ausente');
  }

  // Extract guide number
  const guideMatch = xml.match(/<[\w:]*numeroGuiaPrestador[^>]*>\s*([^<]+)\s*<\//i)
    || xml.match(/<[\w:]*numeroGuiaOperadora[^>]*>\s*([^<]+)\s*<\//i);
  const guideNumber = guideMatch ? guideMatch[1].trim() : null;

  if (!guideNumber) {
    warnings.push('Numero da guia nao encontrado no XML');
  }

  // Detect guide type
  let guideType: string | null = null;
  for (const [tag, type] of Object.entries(GUIDE_TYPE_MAP)) {
    if (xml.includes(tag)) {
      guideType = type;
      break;
    }
  }

  if (!guideType) {
    warnings.push('Tipo de guia nao identificado');
  }

  // Validate TISS version
  const versionMatch = xml.match(/<[\w:]*versaoPadrao[^>]*>\s*([^<]+)\s*<\//i);
  if (versionMatch) {
    const version = versionMatch[1].trim();
    if (!version.startsWith('3.')) {
      warnings.push(`Versao TISS ${version} pode nao ser suportada`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    guideNumber,
    guideType,
  };
}

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'tiss-upload');
    const { success: allowed } = await rateLimit(rlKey, { limit: 10, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'tiss:write');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }
    const body = await request.json();
    const parsed = tissUploadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { xml: rawXml, accountId } = parsed.data;

    if (rawXml.length > MAX_XML_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Arquivo XML excede o tamanho maximo de 5MB' },
        { status: 400 }
      );
    }

    const xml = sanitizeXml(rawXml);

    // When N8N webhook is configured, delegate to n8n
    const n8nWebhookUrl = process.env.N8N_TISS_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xml, accountId }),
      });

      if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text();
        return NextResponse.json(
          { success: false, error: `Erro no webhook n8n: ${n8nResponse.status}`, details: errorText },
          { status: n8nResponse.status }
        );
      }

      const responseText = await n8nResponse.text();
      const result = responseText
        ? JSON.parse(responseText)
        : { success: true, message: 'Upload processado pelo n8n' };

      auditLog(supabase, auth.userId, {
        action: 'tiss.upload',
        resource: 'medical_accounts',
        resource_id: accountId,
        organizationId: auth.organizationId,
        details: { xmlSize: xml.length, processor: 'n8n' },
        ip: getClientIp(request),
      });

      return NextResponse.json(result);
    }

    // Local processing: validate XML and save to Supabase
    const tissResult = parseTissXml(xml);

    if (accountId) {
      const { error: updateError } = await supabase
        .from('medical_accounts')
        .update({
          tiss_xml: xml,
          tiss_guide_number: tissResult.guideNumber,
          tiss_guide_type: tissResult.guideType,
          tiss_validation_status: tissResult.isValid ? 'valid' : 'error',
          tiss_validation_errors: tissResult.errors.length > 0 ? { errors: tissResult.errors } : null,
          status: tissResult.isValid ? 'validated' : 'pending',
        })
        .eq('id', accountId)
        .eq('organization_id', auth.organizationId);

      if (updateError) {
        return NextResponse.json(
          { success: false, error: `Erro ao salvar: ${updateError.message}` },
          { status: 500 }
        );
      }
    }

    auditLog(supabase, auth.userId, {
      action: 'tiss.upload',
      resource: 'medical_accounts',
      resource_id: accountId,
      organizationId: auth.organizationId,
      details: { xmlSize: xml.length, processor: 'local', guideNumber: tissResult.guideNumber },
      ip: getClientIp(request),
    });

    return NextResponse.json({
      success: true,
      isValid: tissResult.isValid,
      errors: tissResult.errors,
      warnings: tissResult.warnings,
      guideNumber: tissResult.guideNumber,
      message: 'Guia TISS processada com sucesso',
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao processar upload TISS' },
      { status: 500 }
    );
  }
}
