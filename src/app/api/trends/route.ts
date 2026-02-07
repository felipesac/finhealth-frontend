import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface MonthlyRow {
  month: string;
  faturamento: number;
  glosas: number;
  pagamentos: number;
}

interface GlosasByTypeRow {
  month: string;
  administrativa: number;
  tecnica: number;
  linear: number;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'reports:read');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '6', 10);

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    const startISO = startDate.toISOString();

    // Fetch medical accounts for the period
    const { data: accounts } = await supabase
      .from('medical_accounts')
      .select('total_amount, glosa_amount, paid_amount, created_at')
      .gte('created_at', startISO)
      .order('created_at', { ascending: true });

    // Fetch glosas for the period
    const { data: glosas } = await supabase
      .from('glosas')
      .select('glosa_amount, glosa_type, created_at')
      .gte('created_at', startISO)
      .order('created_at', { ascending: true });

    // Aggregate accounts by month
    const monthlyMap = new Map<string, MonthlyRow>();
    const glosaTypeMap = new Map<string, GlosasByTypeRow>();

    // Initialize months
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = MONTH_NAMES[d.getMonth()];
      monthlyMap.set(key, { month: label, faturamento: 0, glosas: 0, pagamentos: 0 });
      glosaTypeMap.set(key, { month: label, administrativa: 0, tecnica: 0, linear: 0 });
    }

    // Aggregate medical accounts
    for (const acc of accounts || []) {
      const d = new Date(acc.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const row = monthlyMap.get(key);
      if (row) {
        row.faturamento += Number(acc.total_amount) || 0;
        row.glosas += Number(acc.glosa_amount) || 0;
        row.pagamentos += Number(acc.paid_amount) || 0;
      }
    }

    // Aggregate glosas by type
    for (const g of glosas || []) {
      const d = new Date(g.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const row = glosaTypeMap.get(key);
      if (row && g.glosa_type) {
        const type = g.glosa_type as keyof Omit<GlosasByTypeRow, 'month'>;
        if (type in row) {
          row[type] += Number(g.glosa_amount) || 0;
        }
      }
    }

    const monthlyData = Array.from(monthlyMap.values());
    const glosasTrendData = Array.from(glosaTypeMap.values());

    // Compute forecast metrics from actual data
    const totalFaturamento = monthlyData.reduce((s, m) => s + m.faturamento, 0);
    const totalGlosas = monthlyData.reduce((s, m) => s + m.glosas, 0);
    const activeMonths = monthlyData.filter((m) => m.faturamento > 0).length || 1;

    const avgFaturamento = totalFaturamento / activeMonths;
    const avgGlosas = totalGlosas / activeMonths;
    const glosaRate = totalFaturamento > 0 ? (totalGlosas / totalFaturamento) * 100 : 0;

    // Simple linear trend for forecast
    const lastTwo = monthlyData.slice(-2);
    let forecastFaturamento = avgFaturamento;
    let forecastGrowth = 0;
    if (lastTwo.length === 2 && lastTwo[0].faturamento > 0) {
      forecastGrowth = ((lastTwo[1].faturamento - lastTwo[0].faturamento) / lastTwo[0].faturamento) * 100;
      forecastFaturamento = lastTwo[1].faturamento * (1 + forecastGrowth / 100);
    }

    return NextResponse.json({
      monthlyData,
      glosasTrendData,
      forecast: {
        nextMonthBilling: Math.round(forecastFaturamento),
        billingGrowth: forecastGrowth,
        estimatedGlosaRisk: Math.round(avgGlosas),
        averageGlosaRate: glosaRate,
      },
    });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
