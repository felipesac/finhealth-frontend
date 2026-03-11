import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { checkPermission } from '@/lib/rbac';
import { z } from 'zod';

const PaymentUploadSchema = z.object({
  content: z.string().min(1),
  fileType: z.enum(['csv', 'ofx']),
  healthInsurerId: z.string().uuid().optional().default(''),
});

interface ParsedPayment {
  payment_date: string;
  payment_reference: string;
  total_amount: number;
}

function parseCSV(content: string): ParsedPayment[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].toLowerCase().split(';');
  const dateIdx = headers.findIndex((h) => h.includes('data'));
  const refIdx = headers.findIndex((h) => h.includes('referencia') || h.includes('descricao') || h.includes('historico'));
  const amountIdx = headers.findIndex((h) => h.includes('valor') || h.includes('amount'));

  if (dateIdx === -1 || amountIdx === -1) return [];

  return lines.slice(1).filter(Boolean).map((line) => {
    const cols = line.split(';');
    const rawAmount = cols[amountIdx]?.replace(/[^\d.,-]/g, '').replace(',', '.') || '0';
    return {
      payment_date: cols[dateIdx]?.trim() || '',
      payment_reference: cols[refIdx]?.trim() || '',
      total_amount: Math.abs(parseFloat(rawAmount)),
    };
  }).filter((p) => p.payment_date && p.total_amount > 0);
}

function parseOFX(content: string): ParsedPayment[] {
  const payments: ParsedPayment[] = [];
  const transactions = content.split('<STMTTRN>').slice(1);

  for (const tx of transactions) {
    const dateMatch = tx.match(/<DTPOSTED>(\d{8})/);
    const amountMatch = tx.match(/<TRNAMT>([-\d.]+)/);
    const memoMatch = tx.match(/<MEMO>([^<\n]+)/);
    const nameMatch = tx.match(/<NAME>([^<\n]+)/);

    if (dateMatch && amountMatch) {
      const rawDate = dateMatch[1];
      const date = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
      const amount = Math.abs(parseFloat(amountMatch[1]));

      if (amount > 0) {
        payments.push({
          payment_date: date,
          payment_reference: (memoMatch?.[1] || nameMatch?.[1] || '').trim(),
          total_amount: amount,
        });
      }
    }
  }

  return payments;
}

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'payments-upload');
    const { success: allowed } = await rateLimit(rlKey, { limit: 5, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'payments:write');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const validated = PaymentUploadSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: 'Dados invalidos', details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { content, fileType, healthInsurerId } = validated.data;

    let parsed: ParsedPayment[];

    if (fileType === 'ofx') {
      parsed = parseOFX(content);
    } else {
      parsed = parseCSV(content);
    }

    if (parsed.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum pagamento encontrado no arquivo' },
        { status: 400 }
      );
    }

    const records = parsed.map((p) => ({
      ...p,
      organization_id: auth.organizationId,
      health_insurer_id: healthInsurerId || null,
      matched_amount: 0,
      unmatched_amount: p.total_amount,
      reconciliation_status: 'pending',
      metadata: {},
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('payments')
      .insert(records)
      .select();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: `Falha ao importar pagamentos: ${insertError.message}` },
        { status: 500 }
      );
    }

    auditLog(supabase, auth.userId, {
      action: 'payment.bulk_import',
      resource: 'payments',
      organizationId: auth.organizationId,
      details: {
        file_type: fileType,
        records_imported: inserted?.length || 0,
        health_insurer_id: healthInsurerId,
      },
      ip: getClientIp(request),
    });

    return NextResponse.json({
      success: true,
      message: `${inserted?.length || 0} pagamentos importados com sucesso`,
      data: { count: inserted?.length || 0 },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao processar arquivo' },
      { status: 500 }
    );
  }
}
