import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { checkPermission } from '@/lib/rbac';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { createProcedureSchema } from '@/lib/validations';

export async function GET(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'procedures-list');
    const { success: allowed } = rateLimit(rlKey, { limit: 30, windowSeconds: 60 });
    if (!allowed) return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 });

    const auth = await checkPermission(supabase, 'accounts:read');
    if (!auth) return NextResponse.json({ success: false, error: 'Sem permissao' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');

    let query = supabase
      .from('procedures')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (accountId) {
      query = query.eq('medical_account_id', accountId);
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const from = (page - 1) * limit;

    const { data, count, error } = await query.range(from, from + limit - 1);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: { page, limit, total: count || 0 },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'procedures-create');
    const { success: allowed } = rateLimit(rlKey, { limit: 20, windowSeconds: 60 });
    if (!allowed) return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 });

    const auth = await checkPermission(supabase, 'accounts:write');
    if (!auth) return NextResponse.json({ success: false, error: 'Sem permissao' }, { status: 403 });

    const body = await request.json();
    const parsed = createProcedureSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('procedures')
      .insert(parsed.data)
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    const ip = getClientIp(request);
    auditLog(supabase, user.id, {
      action: 'create',
      resource: 'procedures',
      resource_id: data.id,
      details: { description: parsed.data.description },
      ip,
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
