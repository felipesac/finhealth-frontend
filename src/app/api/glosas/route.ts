import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createGlosaSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { checkPermission } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'glosas-list');
    const { success: allowed } = await rateLimit(rlKey, { limit: 30, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'glosas:read');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    const { data: glosas, error, count } = await supabase
      .from('glosas')
      .select('*, medical_account:medical_accounts(account_number)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: `Falha ao listar glosas: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: glosas || [],
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
      { success: false, error: err.message || 'Falha ao listar glosas' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'glosas-create');
    const { success: allowed } = await rateLimit(rlKey, { limit: 20, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'glosas:write');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const parsed = createGlosaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from('glosas')
      .insert({
        ...parsed.data,
        appeal_status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: `Falha ao criar glosa: ${insertError.message}` },
        { status: 500 }
      );
    }

    auditLog(supabase, auth.userId, {
      action: 'glosa.create',
      resource: 'glosas',
      resource_id: inserted.id,
      details: {
        glosa_code: parsed.data.glosa_code,
        glosa_type: parsed.data.glosa_type,
        glosa_amount: parsed.data.glosa_amount,
      },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: inserted });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao criar glosa' },
      { status: 500 }
    );
  }
}
