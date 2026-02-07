import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exportSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

type TableName = 'accounts' | 'glosas' | 'payments' | 'patients' | 'insurers';

const tableMap: Record<TableName, { table: string; select: string; columns: string[] }> = {
  accounts: {
    table: 'medical_accounts',
    select: 'account_number, account_type, status, total_amount, approved_amount, glosa_amount, paid_amount, created_at',
    columns: ['Numero Conta', 'Tipo', 'Status', 'Valor Total', 'Valor Aprovado', 'Valor Glosado', 'Valor Pago', 'Data Criacao'],
  },
  glosas: {
    table: 'glosas',
    select: 'glosa_code, glosa_description, glosa_type, original_amount, glosa_amount, appeal_status, created_at',
    columns: ['Codigo', 'Descricao', 'Tipo', 'Valor Original', 'Valor Glosado', 'Status Recurso', 'Data Criacao'],
  },
  payments: {
    table: 'payments',
    select: 'payment_date, payment_reference, total_amount, matched_amount, unmatched_amount, reconciliation_status',
    columns: ['Data Pagamento', 'Referencia', 'Valor Total', 'Valor Conciliado', 'Valor Nao Conciliado', 'Status Conciliacao'],
  },
  patients: {
    table: 'patients',
    select: 'name, cpf, birth_date, gender, phone, email, created_at',
    columns: ['Nome', 'CPF', 'Data Nascimento', 'Genero', 'Telefone', 'Email', 'Data Criacao'],
  },
  insurers: {
    table: 'health_insurers',
    select: 'name, ans_code, cnpj, tiss_version, contact_email, active',
    columns: ['Nome', 'Codigo ANS', 'CNPJ', 'Versao TISS', 'Email Contato', 'Ativo'],
  },
};

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCSV(columns: string[], rows: Record<string, unknown>[]): string {
  const header = columns.map(escapeCSV).join(',');
  const body = rows.map((row) => {
    return Object.values(row).map(escapeCSV).join(',');
  });
  return [header, ...body].join('\n');
}

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'export');
    const { success: allowed } = rateLimit(rlKey, { limit: 5, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = exportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { types, dateFrom, dateTo } = parsed.data;

    const allSheets: { name: string; csv: string }[] = [];

    for (const type of types) {
      const config = tableMap[type as TableName];
      if (!config) continue;

      let query = supabase
        .from(config.table)
        .select(config.select)
        .order('created_at', { ascending: false })
        .limit(5000);

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', `${dateTo}T23:59:59`);
      }

      const { data, error } = await query;

      if (error) {
        return NextResponse.json({ error: `Erro ao buscar ${type}: ${error.message}` }, { status: 500 });
      }

      const csv = buildCSV(config.columns, (data || []) as unknown as Record<string, unknown>[]);
      allSheets.push({ name: type, csv });
    }

    if (allSheets.length === 1) {
      return new NextResponse(allSheets[0].csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="finhealth-${allSheets[0].name}-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    // Multiple types: one CSV per type, concatenated with a blank line separator
    // Each section prefixed with the type name as a comment row
    const combined = allSheets
      .map((s) => {
        const typeHeader = s.csv.split('\n')[0];
        const typeRows = s.csv.split('\n').slice(1);
        return [`# ${s.name.toUpperCase()}`, typeHeader, ...typeRows].join('\n');
      })
      .join('\n\n');

    return new NextResponse(combined, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="finhealth-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
