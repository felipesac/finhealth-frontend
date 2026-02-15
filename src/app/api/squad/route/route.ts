import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { createSquadClient } from '@/lib/squad-client';
import { routeRequestSchema } from '@/lib/validations/squad';

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'squad-route');
    const { success: allowed } = await rateLimit(rlKey, { limit: 20, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 },
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'squad:route:write');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = routeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados invalidos', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const client = createSquadClient();
    const result = await client.execute(
      {
        agentId: 'supervisor-agent',
        taskName: 'route-request',
        parameters: parsed.data,
        context: { organizationId: auth.organizationId, userId: auth.userId },
      },
      10_000,
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Erro ao rotear requisicao', details: result.errors },
        { status: 502 },
      );
    }

    auditLog(supabase, auth.userId, {
      action: 'squad.route.request',
      resource: 'squad',
      organizationId: auth.organizationId,
      details: { taskName: 'route-request' },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: result.output, metadata: result.metadata });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json(
      { error: error.message || 'Erro interno ao rotear requisicao' },
      { status: 500 },
    );
  }
}
