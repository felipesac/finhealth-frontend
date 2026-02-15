import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { checkPermission } from '@/lib/rbac';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { updateProcedureSchema } from '@/lib/validations';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rlKey = getRateLimitKey(request, 'procedures-update');
    const { success: allowed } = await rateLimit(rlKey, { limit: 20, windowSeconds: 60 });
    if (!allowed) return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'accounts:write');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = updateProcedureSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('procedures')
      .update(parsed.data)
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    const ip = getClientIp(request);
    auditLog(supabase, auth.userId, { action: 'update', resource: 'procedures', resource_id: id, organizationId: auth.organizationId, details: parsed.data, ip });

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rlKey = getRateLimitKey(request, 'procedures-delete');
    const { success: allowed } = await rateLimit(rlKey, { limit: 10, windowSeconds: 60 });
    if (!allowed) return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'accounts:write');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { error } = await supabase.from('procedures').delete().eq('id', id).eq('organization_id', auth.organizationId);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    const ip = getClientIp(request);
    auditLog(supabase, auth.userId, { action: 'delete', resource: 'procedures', resource_id: id, organizationId: auth.organizationId, ip });

    return NextResponse.json({ success: true, message: 'Procedimento excluido' });
  } catch {
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
