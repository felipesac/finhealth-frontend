import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateAccountSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { checkPermission } from '@/lib/rbac';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rlKey = getRateLimitKey(request, 'accounts-update');
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
    const parsed = updateAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('medical_accounts')
      .update(parsed.data)
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: `Falha ao atualizar conta: ${updateError.message}` },
        { status: 500 }
      );
    }

    auditLog(supabase, auth.userId, {
      action: 'medical_account.update',
      resource: 'medical_accounts',
      resource_id: id,
      organizationId: auth.organizationId,
      details: parsed.data,
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao atualizar conta' },
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

    const rlKey = getRateLimitKey(request, 'accounts-delete');
    const { success: allowed } = await rateLimit(rlKey, { limit: 10, windowSeconds: 60 });
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

    const { error: deleteError } = await supabase
      .from('medical_accounts')
      .delete()
      .eq('id', id)
      .eq('organization_id', auth.organizationId);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: `Falha ao excluir conta: ${deleteError.message}` },
        { status: 500 }
      );
    }

    auditLog(supabase, auth.userId, {
      action: 'medical_account.delete',
      resource: 'medical_accounts',
      resource_id: id,
      organizationId: auth.organizationId,
      details: {},
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, message: 'Conta excluida com sucesso' });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao excluir conta' },
      { status: 500 }
    );
  }
}
