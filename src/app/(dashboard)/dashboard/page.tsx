import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { MetricsGrid, GlosasChart, RecentAccounts } from '@/components/dashboard';
import { RealtimeDashboard } from '@/components/dashboard/RealtimeDashboard';
import { DashboardCustomizer } from '@/components/dashboard/DashboardCustomizer';
import { DashboardWidgets } from '@/components/dashboard/DashboardWidgets';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { PaymentsChart } from '@/components/dashboard/PaymentsChart';
import { AccountsStatusChart } from '@/components/dashboard/AccountsStatusChart';
import { GlosasTrendMini } from '@/components/dashboard/GlosasTrendMini';
import type { DashboardMetrics, MedicalAccount } from '@/types';

export const metadata: Metadata = {
  title: 'Dashboard | FinHealth',
  description: 'Visao geral do faturamento hospitalar',
};

async function getDashboardData() {
  const supabase = await createClient();

  // Fetch all data in parallel
  const [accountsRes, glosasRes, paymentsRes, recentAccountsRes] = await Promise.all([
    supabase
      .from('medical_accounts')
      .select('total_amount, glosa_amount, paid_amount, status'),
    supabase
      .from('glosas')
      .select('glosa_amount, appeal_status, glosa_type, created_at'),
    supabase
      .from('payments')
      .select('total_amount, matched_amount, payment_date'),
    supabase
      .from('medical_accounts')
      .select(`
        *,
        patient:patients(name),
        health_insurer:health_insurers(name)
      `)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  if (accountsRes.error || glosasRes.error || paymentsRes.error || recentAccountsRes.error) {
    const errorMsg = accountsRes.error?.message || glosasRes.error?.message ||
      paymentsRes.error?.message || recentAccountsRes.error?.message;
    throw new Error(errorMsg || 'Erro ao carregar dados do dashboard');
  }

  const accountsList = accountsRes.data || [];
  const glosasList = glosasRes.data || [];
  const paymentsList = paymentsRes.data || [];

  const totalBilling = accountsList.reduce((sum, a) => sum + (a.total_amount || 0), 0);
  const totalGlosas = accountsList.reduce((sum, a) => sum + (a.glosa_amount || 0), 0);
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
  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    validated: 'Validado',
    sent: 'Enviado',
    paid: 'Pago',
    glosa: 'Glosado',
    appeal: 'Em Recurso',
  };
  const statusCounts: Record<string, number> = {};
  accountsList.forEach((a) => {
    const s = a.status || 'pending';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });
  const accountStatusData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    label: statusLabels[status] || status,
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

  return {
    metrics,
    recentAccounts: (recentAccountsRes.data || []) as MedicalAccount[],
    paymentChartData,
    accountStatusData,
    glosasTrendData,
  };
}

export default async function DashboardPage() {
  const { metrics, recentAccounts, paymentChartData, accountStatusData, glosasTrendData } = await getDashboardData();

  return (
    <RealtimeDashboard>
      <div className="space-y-6 sm:space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Visao geral do faturamento hospitalar
            </p>
          </div>
          <DashboardCustomizer />
        </div>

        <DashboardWidgets
          widgetMap={{
            'metrics': <MetricsGrid metrics={metrics} />,
            'charts': (
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                <PaymentsChart data={paymentChartData} />
                <AccountsStatusChart data={accountStatusData} />
              </div>
            ),
            'glosas-chart': (
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                <GlosasChart data={metrics.glosasBreakdown} />
                <GlosasTrendMini data={glosasTrendData} />
              </div>
            ),
            'recent-accounts': <RecentAccounts accounts={recentAccounts} />,
            'quick-actions': <QuickActions />,
          }}
        />
      </div>
    </RealtimeDashboard>
  );
}
