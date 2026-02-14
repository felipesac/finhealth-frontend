import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { createSquadClient } from '@/lib/squad-client';
import { forecastCashflowSchema } from '@/lib/validations/squad';

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'squad-cashflow-forecast');
    const { success: allowed } = await rateLimit(rlKey, { limit: 10, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 },
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'squad:cashflow:write');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = forecastCashflowSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados invalidos', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const client = createSquadClient();
    const result = await client.execute(
      { agentId: 'cashflow-agent', taskName: 'forecast-cashflow', parameters: parsed.data },
      30_000,
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Erro ao gerar projecao de fluxo de caixa', details: result.errors },
        { status: 502 },
      );
    }

    auditLog(supabase, auth.userId, {
      action: 'squad.cashflow.forecast',
      resource: 'squad',
      details: { taskName: 'forecast-cashflow', periodo: parsed.data.periodo_projecao },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: result.output, metadata: result.metadata });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json(
      { error: error.message || 'Erro interno ao gerar projecao' },
      { status: 500 },
    );
  }
}
