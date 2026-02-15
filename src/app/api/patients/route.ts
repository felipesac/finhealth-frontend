import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPatientSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { auditLog, auditRead, getClientIp } from '@/lib/audit-logger';
import { checkPermission } from '@/lib/rbac';
import { maskPatientsPii, maskPatientPii } from '@/lib/pii';

export async function GET(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'patients-list');
    const { success: allowed } = await rateLimit(rlKey, { limit: 30, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Muitas requisicoes.' }, { status: 429 });
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'accounts:read');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .eq('organization_id', auth.organizationId)
      .order('name');

    if (search) {
      query = query.or(`name.ilike.%${search}%,cpf.ilike.%${search}%`);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    auditRead(supabase, auth.userId, {
      resource: 'patients',
      organizationId: auth.organizationId,
      filters: { search, page, limit },
      recordCount: data?.length ?? 0,
      ip: getClientIp(request),
      containsPii: true,
    });

    return NextResponse.json({
      success: true,
      data: maskPatientsPii(data || [], { showFullCpf: auth.role === 'admin' }),
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ success: false, error: err.message || 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'patients-create');
    const { success: allowed } = await rateLimit(rlKey, { limit: 20, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Muitas requisicoes.' }, { status: 429 });
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'accounts:write');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = createPatientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { data: inserted, error: insertError } = await supabase
      .from('patients')
      .insert({
        ...parsed.data,
        organization_id: auth.organizationId,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    auditLog(supabase, auth.userId, {
      action: 'patient.create',
      resource: 'patients',
      resource_id: inserted.id,
      organizationId: auth.organizationId,
      details: { name: parsed.data.name },
      ip: getClientIp(request),
    });

    return NextResponse.json({
      success: true,
      data: maskPatientPii(inserted, { showFullCpf: auth.role === 'admin' }),
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ success: false, error: err.message || 'Erro interno' }, { status: 500 });
  }
}
