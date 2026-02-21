import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { checkPermission } from '@/lib/rbac';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const bulkGlosaSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'Selecione pelo menos um item').max(100, 'Maximo 100 itens'),
  action: z.enum(['update_status', 'delete']),
  appeal_status: z.enum(['pending', 'in_progress', 'sent', 'accepted', 'rejected']).optional(),
}).refine(
  (data) => data.action !== 'update_status' || data.appeal_status,
  { message: 'Status obrigatorio para atualizacao', path: ['appeal_status'] }
);

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'glosas-bulk');
    const { success: allowed } = await rateLimit(rlKey, { limit: 10, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'glosas:write');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = bulkGlosaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { ids, action, appeal_status } = parsed.data;
    const ip = getClientIp(request);

    if (action === 'update_status' && appeal_status) {
      const { error } = await supabase
        .from('glosas')
        .update({ appeal_status })
        .in('id', ids)
        .eq('organization_id', auth.organizationId);
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

      auditLog(supabase, auth.userId, { action: 'bulk_update_status', resource: 'glosas', organizationId: auth.organizationId, details: { ids, appeal_status }, ip });
    }

    if (action === 'delete') {
      const { error } = await supabase
        .from('glosas')
        .delete()
        .in('id', ids)
        .eq('organization_id', auth.organizationId);
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

      auditLog(supabase, auth.userId, { action: 'bulk_delete', resource: 'glosas', organizationId: auth.organizationId, details: { ids }, ip });
    }

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    logger.error('Failed to bulk update glosas', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
