import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { MetricsGrid, GlosasChart, RecentAccounts } from '@/components/dashboard';
import { RealtimeDashboard } from '@/components/dashboard/RealtimeDashboard';
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
      .select('glosa_amount, appeal_status, glosa_type'),
    supabase
      .from('payments')
      .select('total_amount'),
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

  return {
    metrics,
    recentAccounts: (recentAccountsRes.data || []) as MedicalAccount[],
  };
}

export default async function DashboardPage() {
  const { metrics, recentAccounts } = await getDashboardData();

  return (
    <RealtimeDashboard>
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visao geral do faturamento hospitalar
          </p>
        </div>

        <MetricsGrid metrics={metrics} />

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <GlosasChart data={metrics.glosasBreakdown} />
          <RecentAccounts accounts={recentAccounts} />
        </div>
      </div>
    </RealtimeDashboard>
  );
}
