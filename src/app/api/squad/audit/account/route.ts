import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { createSquadClient } from '@/lib/squad-client';
import { auditAccountSchema } from '@/lib/validations/squad';

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'squad-audit-account');
    const { success: allowed } = await rateLimit(rlKey, { limit: 5, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 },
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'squad:audit:write');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = auditAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Dados invalidos', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const client = createSquadClient();
    const result = await client.execute(
      {
        agentId: 'auditor-agent',
        taskName: 'audit-account',
        parameters: parsed.data,
        context: { organizationId: auth.organizationId, userId: auth.userId },
      },
      120_000,
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Erro ao auditar conta', details: result.errors },
        { status: 502 },
      );
    }

    auditLog(supabase, auth.userId, {
      action: 'squad.audit.account',
      resource: 'squad',
      resource_id: parsed.data.conta.id,
      organizationId: auth.organizationId,
      details: { taskName: 'audit-account' },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: result.output, metadata: result.metadata });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno ao auditar conta' },
      { status: 500 },
    );
  }
}
