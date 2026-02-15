import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { checkPermission } from '@/lib/rbac';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { z } from 'zod';

const bulkAccountSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'Selecione pelo menos um item'),
  action: z.enum(['update_status', 'delete']),
  status: z.enum(['pending', 'validated', 'sent', 'paid', 'glosa', 'appeal']).optional(),
}).refine(
  (data) => data.action !== 'update_status' || data.status,
  { message: 'Status obrigatorio para atualizacao', path: ['status'] }
);

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'accounts-bulk');
    const { success: allowed } = await rateLimit(rlKey, { limit: 10, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'accounts:write');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = bulkAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { ids, action, status } = parsed.data;
    const ip = getClientIp(request);

    if (action === 'update_status' && status) {
      const { error } = await supabase
        .from('medical_accounts')
        .update({ status })
        .in('id', ids)
        .eq('organization_id', auth.organizationId);
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

      auditLog(supabase, auth.userId, { action: 'bulk_update_status', resource: 'medical_accounts', organizationId: auth.organizationId, details: { ids, status }, ip });
    }

    if (action === 'delete') {
      const { error } = await supabase
        .from('medical_accounts')
        .delete()
        .in('id', ids)
        .eq('organization_id', auth.organizationId);
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

      auditLog(supabase, auth.userId, { action: 'bulk_delete', resource: 'medical_accounts', organizationId: auth.organizationId, details: { ids }, ip });
    }

    return NextResponse.json({ success: true, count: ids.length });
  } catch {
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
