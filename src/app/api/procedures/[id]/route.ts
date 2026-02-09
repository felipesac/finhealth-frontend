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
    const { success: allowed } = rateLimit(rlKey, { limit: 20, windowSeconds: 60 });
    if (!allowed) return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 });

    const auth = await checkPermission(supabase, 'accounts:write');
    if (!auth) return NextResponse.json({ success: false, error: 'Sem permissao' }, { status: 403 });

    const body = await request.json();
    const parsed = updateProcedureSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('procedures')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    const ip = getClientIp(request);
    auditLog(supabase, user.id, { action: 'update', resource: 'procedures', resource_id: id, details: parsed.data, ip });

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
    const { success: allowed } = rateLimit(rlKey, { limit: 10, windowSeconds: 60 });
    if (!allowed) return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 });

    const auth = await checkPermission(supabase, 'accounts:write');
    if (!auth) return NextResponse.json({ success: false, error: 'Sem permissao' }, { status: 403 });

    const { error } = await supabase.from('procedures').delete().eq('id', id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    const ip = getClientIp(request);
    auditLog(supabase, user.id, { action: 'delete', resource: 'procedures', resource_id: id, ip });

    return NextResponse.json({ success: true, message: 'Procedimento excluido' });
  } catch {
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
