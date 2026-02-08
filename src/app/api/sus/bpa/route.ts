import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { susBpaSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { checkPermission } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'sus-bpa-list');
    const { success: allowed } = rateLimit(rlKey, { limit: 30, windowSeconds: 60 });
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
    const competencia = searchParams.get('competencia');
    const status = searchParams.get('status');

    let query = supabase
      .from('sus_bpa')
      .select('*, patient:patients(id, name)')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false });

    if (competencia) query = query.eq('competencia', competencia);
    if (status) query = query.eq('status', status);

    const { data, error } = await query.limit(200);

    if (error) {
      return NextResponse.json(
        { success: false, error: `Falha ao buscar BPAs: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao buscar BPAs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'sus-bpa-create');
    const { success: allowed } = rateLimit(rlKey, { limit: 20, windowSeconds: 60 });
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
    const parsed = susBpaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Lookup procedure value from SIGTAP table
    const { data: proc } = await supabase
      .from('sus_procedures')
      .select('valor_ambulatorial')
      .eq('codigo_sigtap', parsed.data.procedimento)
      .order('competencia', { ascending: false })
      .limit(1)
      .maybeSingle();

    const valorUnitario = proc?.valor_ambulatorial || 0;
    const valorTotal = valorUnitario * parsed.data.quantidade;

    const { data: inserted, error: insertError } = await supabase
      .from('sus_bpa')
      .insert({
        user_id: auth.userId,
        ...parsed.data,
        valor_unitario: valorUnitario,
        valor_total: valorTotal,
        status: 'rascunho',
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: `Falha ao criar BPA: ${insertError.message}` },
        { status: 500 }
      );
    }

    auditLog(supabase, auth.userId, {
      action: 'sus_bpa.create',
      resource: 'sus_bpa',
      resource_id: inserted.id,
      details: {
        cnes: parsed.data.cnes,
        procedimento: parsed.data.procedimento,
        competencia: parsed.data.competencia,
        quantidade: parsed.data.quantidade,
        valor_total: valorTotal,
      },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: inserted });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao criar BPA' },
      { status: 500 }
    );
  }
}
