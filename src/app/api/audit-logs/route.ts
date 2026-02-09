import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { checkPermission } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'audit-logs');
    const { success: allowed } = rateLimit(rlKey, { limit: 30, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'audit:read');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const action = url.searchParams.get('action') || '';
    const resource = url.searchParams.get('resource') || '';
    const offset = (page - 1) * limit;

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (action) {
      query = query.ilike('action', `%${action}%`);
    }

    if (resource) {
      query = query.eq('resource', resource);
    }

    const { data: logs, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      }
      return NextResponse.json(
        { success: false, error: `Falha ao listar logs: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao listar logs de auditoria' },
      { status: 500 }
    );
  }
}
