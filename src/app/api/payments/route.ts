import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPaymentSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { checkPermission } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'payments-list');
    const { success: allowed } = rateLimit(rlKey, { limit: 30, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'payments:read');
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

    const { data: payments, error, count } = await supabase
      .from('payments')
      .select('*, health_insurer:health_insurers(id, name)', { count: 'exact' })
      .order('payment_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: `Falha ao listar pagamentos: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: payments || [],
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
      { success: false, error: err.message || 'Falha ao listar pagamentos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'payments-create');
    const { success: allowed } = rateLimit(rlKey, { limit: 20, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'payments:write');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const parsed = createPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from('payments')
      .insert({
        ...parsed.data,
        matched_amount: 0,
        unmatched_amount: parsed.data.total_amount,
        reconciliation_status: 'pending',
        metadata: {},
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: `Falha ao criar pagamento: ${insertError.message}` },
        { status: 500 }
      );
    }

    auditLog(supabase, auth.userId, {
      action: 'payment.create',
      resource: 'payments',
      resource_id: inserted.id,
      details: {
        total_amount: parsed.data.total_amount,
        health_insurer_id: parsed.data.health_insurer_id,
        payment_date: parsed.data.payment_date,
      },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: inserted });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao criar pagamento' },
      { status: 500 }
    );
  }
}
