import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createInsurerSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { checkPermission } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'insurers-list');
    const { success: allowed } = rateLimit(rlKey, { limit: 30, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Muitas requisicoes.' }, { status: 429 });
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'settings:read');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { data, error } = await supabase
      .from('health_insurers')
      .select('*')
      .order('name');

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ success: false, error: err.message || 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'insurers-create');
    const { success: allowed } = rateLimit(rlKey, { limit: 10, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Muitas requisicoes.' }, { status: 429 });
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'settings:write');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = createInsurerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { data: inserted, error: insertError } = await supabase
      .from('health_insurers')
      .insert({ ...parsed.data, config: {} })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    auditLog(supabase, auth.userId, {
      action: 'health_insurer.create',
      resource: 'health_insurers',
      resource_id: inserted.id,
      details: { name: parsed.data.name, ans_code: parsed.data.ans_code },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: inserted });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ success: false, error: err.message || 'Erro interno' }, { status: 500 });
  }
}
