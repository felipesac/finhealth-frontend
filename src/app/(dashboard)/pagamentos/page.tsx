import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentsTable } from '@/components/payments/PaymentsTable';
import { PaymentFilters } from '@/components/payments/PaymentFilters';
import { PaymentUpload } from '@/components/payments/PaymentUpload';
import { Pagination } from '@/components/ui/pagination';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { formatCurrency } from '@/lib/formatters';
import type { Payment, HealthInsurer } from '@/types';

export const metadata: Metadata = {
  title: 'Pagamentos | FinHealth',
  description: 'Gestao de pagamentos recebidos e conciliacao bancaria',
};

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; status?: string; insurerId?: string }>;
}

async function getPaymentsData(page: number, search: string, status: string, insurerId: string) {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('payments')
    .select(`
      *,
      health_insurer:health_insurers(id, name)
    `, { count: 'exact' })
    .order('payment_date', { ascending: false });

  if (search) {
    query = query.ilike('payment_reference', `%${search}%`);
  }

  if (status && status !== 'all') {
    query = query.eq('reconciliation_status', status);
  }

  if (insurerId && insurerId !== 'all') {
    query = query.eq('health_insurer_id', insurerId);
  }

  const { data: payments, count } = await query.range(from, from + PAGE_SIZE - 1);

  // Metrics from all payments (not paginated)
  const { data: allPayments } = await supabase
    .from('payments')
    .select('total_amount, matched_amount, unmatched_amount, reconciliation_status');

  const all = allPayments || [];
  const totalReceived = all.reduce((s, p) => s + (p.total_amount || 0), 0);
  const totalMatched = all.reduce((s, p) => s + (p.matched_amount || 0), 0);
  const totalUnmatched = all.reduce((s, p) => s + (p.unmatched_amount || 0), 0);
  const pendingCount = all.filter((p) => p.reconciliation_status === 'pending').length;

  return {
    payments: (payments || []) as Payment[],
    total: count || 0,
    metrics: { totalReceived, totalMatched, totalUnmatched, pendingCount },
  };
}

export default async function PagamentosPage({ searchParams }: PageProps) {
  const t = await getTranslations('payments');
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const search = params.search || '';
  const status = params.status || 'all';
  const insurerId = params.insurerId || 'all';
  const { payments, total, metrics } = await getPaymentsData(page, search, status, insurerId);

  const supabase = await createClient();
  const { data: insurersList } = await supabase
    .from('health_insurers')
    .select('id, ans_code, name, cnpj, tiss_version, contact_email, api_endpoint, config, active, created_at, updated_at')
    .eq('active', true)
    .order('name');

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <PaymentFilters insurers={(insurersList || []) as HealthInsurer[]} />

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('totalReceived')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalReceived)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('matched')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalMatched)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('difference')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(metrics.totalUnmatched)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('pending')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingCount}</div>
            <p className="text-xs text-muted-foreground">{t('paymentsToReconcile')}</p>
          </CardContent>
        </Card>
      </div>

      <PaymentUpload insurers={(insurersList || []) as { id: string; name: string }[]} />

      <ErrorBoundary fallbackMessage={t('errorLoading')}>
        <PaymentsTable payments={payments} />
      </ErrorBoundary>
      <Pagination total={total} pageSize={PAGE_SIZE} currentPage={page} />
    </div>
  );
}
