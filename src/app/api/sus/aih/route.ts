import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { susAihSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { checkPermission } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'sus-aih-list');
    const { success: allowed } = await rateLimit(rlKey, { limit: 30, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'sus:read');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tipo = searchParams.get('tipo');

    let query = supabase
      .from('sus_aih')
      .select('*, patient:patients(id, name)')
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (tipo) query = query.eq('tipo_aih', tipo);

    const { data, error } = await query.limit(200);

    if (error) {
      return NextResponse.json(
        { success: false, error: `Falha ao buscar AIHs: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao buscar AIHs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'sus-aih-create');
    const { success: allowed } = await rateLimit(rlKey, { limit: 20, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'sus:write');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const parsed = susAihSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Check for duplicate AIH number
    const { data: existing } = await supabase
      .from('sus_aih')
      .select('id')
      .eq('numero_aih', parsed.data.numero_aih)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Numero AIH ja cadastrado' },
        { status: 409 }
      );
    }

    // Calculate diarias if dates provided
    let diarias = parsed.data.diarias;
    if (parsed.data.data_saida && parsed.data.data_internacao) {
      const entrada = new Date(parsed.data.data_internacao);
      const saida = new Date(parsed.data.data_saida);
      diarias = Math.max(0, Math.ceil((saida.getTime() - entrada.getTime()) / (1000 * 60 * 60 * 24)));
    }

    const { data: inserted, error: insertError } = await supabase
      .from('sus_aih')
      .insert({
        user_id: auth.userId,
        organization_id: auth.organizationId,
        ...parsed.data,
        diarias,
        status: 'rascunho',
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: `Falha ao criar AIH: ${insertError.message}` },
        { status: 500 }
      );
    }

    auditLog(supabase, auth.userId, {
      action: 'sus_aih.create',
      resource: 'sus_aih',
      resource_id: inserted.id,
      organizationId: auth.organizationId,
      details: {
        numero_aih: parsed.data.numero_aih,
        procedimento_principal: parsed.data.procedimento_principal,
        tipo_aih: parsed.data.tipo_aih,
        valor: parsed.data.valor,
      },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: inserted });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao criar AIH' },
      { status: 500 }
    );
  }
}
