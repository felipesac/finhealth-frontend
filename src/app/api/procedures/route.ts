import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { checkPermission } from '@/lib/rbac';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { createProcedureSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'procedures-list');
    const { success: allowed } = await rateLimit(rlKey, { limit: 30, windowSeconds: 60 });
    if (!allowed) return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'accounts:read');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');

    let query = supabase
      .from('procedures')
      .select('*', { count: 'exact' })
      .eq('organization_id', auth.organizationId)
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
  } catch (error) {
    logger.error('Failed to list procedures', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'procedures-create');
    const { success: allowed } = await rateLimit(rlKey, { limit: 20, windowSeconds: 60 });
    if (!allowed) return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'accounts:write');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = createProcedureSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('procedures')
      .insert({ ...parsed.data, organization_id: auth.organizationId })
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    const ip = getClientIp(request);
    auditLog(supabase, auth.userId, {
      action: 'create',
      resource: 'procedures',
      resource_id: data.id,
      organizationId: auth.organizationId,
      details: { description: parsed.data.description },
      ip,
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create procedure', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
