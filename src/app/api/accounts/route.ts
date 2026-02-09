import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAccountSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { checkPermission } from '@/lib/rbac';

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'accounts-create');
    const { success: allowed } = rateLimit(rlKey, { limit: 20, windowSeconds: 60 });
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
    const parsed = createAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from('medical_accounts')
      .insert({
        ...parsed.data,
        status: 'pending',
        approved_amount: 0,
        glosa_amount: 0,
        paid_amount: 0,
        metadata: {},
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: `Falha ao criar conta: ${insertError.message}` },
        { status: 500 }
      );
    }

    auditLog(supabase, auth.userId, {
      action: 'medical_account.create',
      resource: 'medical_accounts',
      resource_id: inserted.id,
      details: {
        account_number: parsed.data.account_number,
        account_type: parsed.data.account_type,
        total_amount: parsed.data.total_amount,
        health_insurer_id: parsed.data.health_insurer_id,
      },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: inserted });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao criar conta medica' },
      { status: 500 }
    );
  }
}
