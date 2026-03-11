import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { appealSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { checkPermission } from '@/lib/rbac';

export async function PATCH(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'appeals');
    const { success: allowed } = await rateLimit(rlKey, { limit: 30, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'appeals:write');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    const body = await request.json();
    const parsed = appealSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { glosaId, text, action } = parsed.data;

    if (action === 'submit') {
      const { error } = await supabase
        .from('glosas')
        .update({
          appeal_text: text,
          appeal_status: 'sent',
          appeal_sent_at: new Date().toISOString(),
        })
        .eq('id', glosaId)
        .eq('organization_id', auth.organizationId);

      if (error) throw error;

      auditLog(supabase, auth.userId, {
        action: 'appeal.submit',
        resource: 'glosas',
        resource_id: glosaId,
        organizationId: auth.organizationId,
        ip: getClientIp(request),
      });

      return NextResponse.json({ success: true, message: 'Recurso enviado com sucesso' });
    }

    // save_draft
    const { error } = await supabase
      .from('glosas')
      .update({
        appeal_text: text,
        appeal_status: 'in_progress',
      })
      .eq('id', glosaId)
      .eq('organization_id', auth.organizationId);

    if (error) throw error;

    auditLog(supabase, auth.userId, {
      action: 'appeal.save_draft',
      resource: 'glosas',
      resource_id: glosaId,
      organizationId: auth.organizationId,
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, message: 'Rascunho salvo com sucesso' });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao processar recurso' },
      { status: 500 }
    );
  }
}
