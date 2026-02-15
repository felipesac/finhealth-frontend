import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { checkPermission } from '@/lib/rbac';
import type { DashboardMetrics } from '@/types';

export async function GET(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'dashboard-stats');
    const { success: allowed } = await rateLimit(rlKey, { limit: 30, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'dashboard:read');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const [accountsRes, glosasRes, paymentsRes, recentAccountsRes] = await Promise.all([
      supabase
        .from('medical_accounts')
        .select('total_amount, glosa_amount, paid_amount, status')
        .eq('organization_id', auth.organizationId),
      supabase
        .from('glosas')
        .select('glosa_amount, appeal_status, glosa_type, created_at')
        .eq('organization_id', auth.organizationId),
      supabase
        .from('payments')
        .select('total_amount, matched_amount, payment_date')
        .eq('organization_id', auth.organizationId),
      supabase
        .from('medical_accounts')
        .select('*, patient:patients(name), health_insurer:health_insurers(name)')
        .eq('organization_id', auth.organizationId)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const accountsList = accountsRes.data || [];
    const glosasList = glosasRes.data || [];
    const paymentsList = paymentsRes.data || [];

    const totalBilling = accountsList.reduce((sum, a) => sum + (a.total_amount || 0), 0);
    const totalGlosas = glosasList.reduce((sum, g) => sum + (g.glosa_amount || 0), 0);
    const totalPayments = paymentsList.reduce((sum, p) => sum + (p.total_amount || 0), 0);
    const pendingAccounts = accountsList.filter((a) => a.status === 'pending').length;

    const acceptedAppeals = glosasList.filter((g) => g.appeal_status === 'accepted').length;
    const totalAppeals = glosasList.filter((g) => g.appeal_status !== 'pending').length;
    const appealSuccessRate = totalAppeals > 0 ? (acceptedAppeals / totalAppeals) * 100 : 0;

    const glosasBreakdown = (['administrativa', 'tecnica', 'linear'] as const).map((type) => ({
      type,
      count: glosasList.filter((g) => g.glosa_type === type).length,
      amount: glosasList
        .filter((g) => g.glosa_type === type)
        .reduce((sum, g) => sum + (g.glosa_amount || 0), 0),
    }));

    const metrics: DashboardMetrics = {
      totalBilling,
      totalGlosas,
      totalPayments,
      pendingAccounts,
      appealSuccessRate,
      glosasBreakdown,
    };

    // Payment trends (last 6 months)
    const paymentsByMonth: Record<string, { received: number; matched: number }> = {};
    paymentsList.forEach((p) => {
      const month = (p.payment_date as string | null)?.substring(0, 7) || 'unknown';
      if (!paymentsByMonth[month]) paymentsByMonth[month] = { received: 0, matched: 0 };
      paymentsByMonth[month].received += p.total_amount || 0;
      paymentsByMonth[month].matched += (p.matched_amount as number | null) || 0;
    });
    const paymentChartData = Object.entries(paymentsByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, vals]) => ({ month, ...vals }));

    // Account status distribution
    const statusCounts: Record<string, number> = {};
    accountsList.forEach((a) => {
      const s = a.status || 'pending';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });
    const accountStatusData = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      label: status,
    }));

    // Glosa monthly trend
    const glosasByMonth: Record<string, number> = {};
    glosasList.forEach((g) => {
      const month = (g.created_at as string | null)?.substring(0, 7) || 'unknown';
      glosasByMonth[month] = (glosasByMonth[month] || 0) + (g.glosa_amount || 0);
    });
    const glosasTrendData = Object.entries(glosasByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, amount]) => ({ month, amount }));

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        recentAccounts: recentAccountsRes.data || [],
        paymentChartData,
        accountStatusData,
        glosasTrendData,
      },
    }, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao carregar metricas' },
      { status: 500 }
    );
  }
}
