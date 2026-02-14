import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { createSquadClient } from '@/lib/squad-client';
import { validateTissSchema } from '@/lib/validations/squad';

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'squad-billing-validate');
    const { success: allowed } = await rateLimit(rlKey, { limit: 10, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 },
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'squad:billing:write');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = validateTissSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados invalidos', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const client = createSquadClient();
    const result = await client.execute(
      { agentId: 'billing-agent', taskName: 'validate-tiss', parameters: parsed.data },
      30_000,
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Erro ao validar guia TISS', details: result.errors },
        { status: 502 },
      );
    }

    auditLog(supabase, auth.userId, {
      action: 'squad.billing.validate',
      resource: 'squad',
      details: { taskName: 'validate-tiss' },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: result.output, metadata: result.metadata });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json(
      { error: error.message || 'Erro interno ao validar guia TISS' },
      { status: 500 },
    );
  }
}
