import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { createSquadClient } from '@/lib/squad-client';
import { reconcilePaymentSchema } from '@/lib/validations/squad';

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'squad-reconciliation-reconcile');
    const { success: allowed } = await rateLimit(rlKey, { limit: 5, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 },
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'squad:reconciliation:write');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = reconcilePaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados invalidos', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const client = createSquadClient();
    const result = await client.execute(
      { agentId: 'reconciliation-agent', taskName: 'reconcile-payment', parameters: parsed.data },
      60_000,
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Erro ao conciliar repasse', details: result.errors },
        { status: 502 },
      );
    }

    auditLog(supabase, auth.userId, {
      action: 'squad.reconciliation.reconcile',
      resource: 'squad',
      details: { taskName: 'reconcile-payment', competencia: parsed.data.repasse.competencia },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: result.output, metadata: result.metadata });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json(
      { error: error.message || 'Erro interno ao conciliar repasse' },
      { status: 500 },
    );
  }
}
