import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updatePaymentSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { checkPermission } from '@/lib/rbac';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rlKey = getRateLimitKey(request, 'payments-update');
    const { success: allowed } = await rateLimit(rlKey, { limit: 20, windowSeconds: 60 });
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
    const parsed = updatePaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('payments')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: `Falha ao atualizar pagamento: ${updateError.message}` },
        { status: 500 }
      );
    }

    auditLog(supabase, auth.userId, {
      action: 'payment.update',
      resource: 'payments',
      resource_id: id,
      details: parsed.data,
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao atualizar pagamento' },
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

    const rlKey = getRateLimitKey(request, 'payments-delete');
    const { success: allowed } = await rateLimit(rlKey, { limit: 10, windowSeconds: 60 });
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

    const { error: deleteError } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: `Falha ao excluir pagamento: ${deleteError.message}` },
        { status: 500 }
      );
    }

    auditLog(supabase, auth.userId, {
      action: 'payment.delete',
      resource: 'payments',
      resource_id: id,
      details: {},
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, message: 'Pagamento excluido com sucesso' });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao excluir pagamento' },
      { status: 500 }
    );
  }
}
