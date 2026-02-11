import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { MetricsGrid, RecentAccounts } from '@/components/dashboard';
import { RealtimeDashboard } from '@/components/dashboard/RealtimeDashboard';
import { DashboardCustomizer } from '@/components/dashboard/DashboardCustomizer';
import { DashboardWidgets } from '@/components/dashboard/DashboardWidgets';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ChartSkeleton } from '@/components/ui/ChartSkeleton';
import type { DashboardMetrics, MedicalAccount } from '@/types';

const GlosasChart = dynamic(
  () => import('@/components/dashboard/GlosasChart').then((m) => m.GlosasChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);
const PaymentsChart = dynamic(
  () => import('@/components/dashboard/PaymentsChart').then((m) => m.PaymentsChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);
const AccountsStatusChart = dynamic(
  () => import('@/components/dashboard/AccountsStatusChart').then((m) => m.AccountsStatusChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);
const GlosasTrendMini = dynamic(
  () => import('@/components/dashboard/GlosasTrendMini').then((m) => m.GlosasTrendMini),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

export const metadata: Metadata = {
  title: 'Dashboard | FinHealth',
  description: 'Visao geral do faturamento hospitalar',
};

async function getDashboardData() {
  const t = await getTranslations('dashboard');
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
    pending: t('statusLabels.pending'),
    validated: t('statusLabels.validated'),
    sent: t('statusLabels.sent'),
    paid: t('statusLabels.paid'),
    glosa: t('statusLabels.glosa'),
    appeal: t('statusLabels.appeal'),
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
  const t = await getTranslations('dashboard');
  const { metrics, recentAccounts, paymentChartData, accountStatusData, glosasTrendData } = await getDashboardData();

  return (
    <RealtimeDashboard>
      <div className="space-y-6 sm:space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('description')}
            </p>
          </div>
          <DashboardCustomizer />
        </div>

        <DashboardWidgets
          widgetMap={{
            'metrics': (
              <ErrorBoundary fallbackMessage={t('errorMetrics')}>
                <MetricsGrid metrics={metrics} />
              </ErrorBoundary>
            ),
            'charts': (
              <ErrorBoundary fallbackMessage={t('errorCharts')}>
                <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                  <PaymentsChart data={paymentChartData} />
                  <AccountsStatusChart data={accountStatusData} />
                </div>
              </ErrorBoundary>
            ),
            'glosas-chart': (
              <ErrorBoundary fallbackMessage={t('errorGlosasCharts')}>
                <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                  <GlosasChart data={metrics.glosasBreakdown} />
                  <GlosasTrendMini data={glosasTrendData} />
                </div>
              </ErrorBoundary>
            ),
            'recent-accounts': (
              <ErrorBoundary fallbackMessage={t('errorRecentAccounts')}>
                <RecentAccounts accounts={recentAccounts} />
              </ErrorBoundary>
            ),
            'quick-actions': <QuickActions />,
          }}
        />
      </div>
    </RealtimeDashboard>
  );
}
