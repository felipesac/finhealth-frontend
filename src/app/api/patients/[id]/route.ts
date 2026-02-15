import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updatePatientSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { auditLog, auditRead, getClientIp } from '@/lib/audit-logger';
import { checkPermission } from '@/lib/rbac';
import { maskPatientPii } from '@/lib/pii';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rlKey = getRateLimitKey(request, 'patients-detail');
    const { success: allowed } = await rateLimit(rlKey, { limit: 30, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'accounts:read');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Paciente nao encontrado' },
        { status: 404 }
      );
    }

    auditRead(supabase, auth.userId, {
      resource: 'patients',
      organizationId: auth.organizationId,
      recordCount: 1,
      containsPii: true,
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: maskPatientPii(data) });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao buscar paciente' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rlKey = getRateLimitKey(request, 'patients-update');
    const { success: allowed } = await rateLimit(rlKey, { limit: 20, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'accounts:write');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const parsed = updatePatientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('patients')
      .update(parsed.data)
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: `Falha ao atualizar paciente: ${updateError.message}` },
        { status: 500 }
      );
    }

    auditLog(supabase, auth.userId, {
      action: 'patient.update',
      resource: 'patients',
      resource_id: id,
      organizationId: auth.organizationId,
      details: parsed.data,
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: maskPatientPii(updated) });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao atualizar paciente' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rlKey = getRateLimitKey(request, 'patients-delete');
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

    // LGPD: DELETE performs anonymization, not hard delete
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
        { success: false, error: `Falha ao excluir paciente: ${updateError.message}` },
        { status: 500 }
      );
    }

    auditLog(supabase, auth.userId, {
      action: 'patient.anonymize',
      resource: 'patients',
      resource_id: id,
      organizationId: auth.organizationId,
      details: { reason: 'LGPD Art. 18 — Exclusao via API', lgpd_article: '18' },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, message: 'Dados do paciente anonimizados com sucesso' });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao excluir paciente' },
      { status: 500 }
    );
  }
}
