import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { checkPermission } from '@/lib/rbac';

/**
 * POST /api/patients/[id]/anonymize
 *
 * LGPD Art. 18 — Right to erasure.
 * Anonymizes a patient's PII data while preserving referential integrity.
 * Medical accounts, procedures, and glosas still reference patient_id (UUID)
 * but the personal data is overwritten with anonymized values.
 *
 * Requires admin permission.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rlKey = getRateLimitKey(request, 'patients-anonymize');
    const { success: allowed } = await rateLimit(rlKey, { limit: 5, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'admin:all');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    // Parse optional reason from request body
    let reason = 'LGPD Art. 18 — Solicitacao do titular';
    try {
      const body = await request.json();
      if (body.reason && typeof body.reason === 'string') {
        reason = body.reason;
      }
    } catch {
      // Body is optional
    }

    // Verify patient exists and belongs to this organization
    const { data: patient, error: fetchError } = await supabase
      .from('patients')
      .select('id, name')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .single();

    if (fetchError || !patient) {
      return NextResponse.json(
        { success: false, error: 'Paciente nao encontrado' },
        { status: 404 }
      );
    }

    // Anonymize PII fields — preserves UUID for referential integrity
    const shortId = id.slice(0, 8);
    const { error: updateError } = await supabase
      .from('patients')
      .update({
        name: `Paciente Anonimizado ${shortId}`,
        cpf: null,
        birth_date: null,
        gender: null,
        phone: null,
        email: null,
        address: {},
        external_id: null,
      })
      .eq('id', id)
      .eq('organization_id', auth.organizationId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: `Falha ao anonimizar paciente: ${updateError.message}` },
        { status: 500 }
      );
    }

    auditLog(supabase, auth.userId, {
      action: 'patient.anonymize',
      resource: 'patients',
      resource_id: id,
      organizationId: auth.organizationId,
      details: { reason, lgpd_article: '18' },
      ip: getClientIp(request),
    });

    return NextResponse.json({
      success: true,
      message: 'Dados do paciente anonimizados com sucesso',
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Erro interno ao anonimizar paciente' },
      { status: 500 }
    );
  }
}
