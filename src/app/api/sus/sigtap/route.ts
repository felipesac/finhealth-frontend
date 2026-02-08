import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { checkPermission } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'sus-sigtap-search');
    const { success: allowed } = rateLimit(rlKey, { limit: 60, windowSeconds: 60 });
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
    const q = searchParams.get('q')?.trim();
    const grupo = searchParams.get('grupo');
    const tipo = searchParams.get('tipo');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

    if (!q || q.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Parametro de busca "q" deve ter pelo menos 2 caracteres.' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('sus_procedures')
      .select('id, codigo_sigtap, nome, competencia, valor_ambulatorial, valor_hospitalar, complexidade, modalidade, grupo, subgrupo, tipo, codigo_grupo');

    // Search by code or name
    const isCode = /^\d+$/.test(q);
    if (isCode) {
      query = query.like('codigo_sigtap', `${q}%`);
    } else {
      query = query.ilike('nome', `%${q}%`);
    }

    // Optional filters
    if (grupo) query = query.eq('codigo_grupo', grupo);
    if (tipo) query = query.eq('tipo', tipo);

    query = query.order('nome').limit(limit);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: `Falha ao buscar procedimentos: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, procedures: data || [] });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao buscar procedimentos SIGTAP' },
      { status: 500 }
    );
  }
}
