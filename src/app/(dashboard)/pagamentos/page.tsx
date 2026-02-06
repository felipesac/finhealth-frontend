import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentsTable } from '@/components/payments/PaymentsTable';
import { Pagination } from '@/components/ui/pagination';
import { formatCurrency } from '@/lib/formatters';
import type { Payment } from '@/types';

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

async function getPaymentsData(page: number) {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;

  const { data: payments, count } = await supabase
    .from('payments')
    .select(`
      *,
      health_insurer:health_insurers(id, name)
    `, { count: 'exact' })
    .order('payment_date', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

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
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || '1', 10));
  const { payments, total, metrics } = await getPaymentsData(page);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pagamentos</h1>
        <p className="text-muted-foreground">
          Gestao de pagamentos recebidos e conciliacao bancaria
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalReceived)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conciliado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalMatched)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Diferenca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(metrics.totalUnmatched)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingCount}</div>
            <p className="text-xs text-muted-foreground">pagamentos para conciliar</p>
          </CardContent>
        </Card>
      </div>

      <PaymentsTable payments={payments} />
      <Pagination total={total} pageSize={PAGE_SIZE} currentPage={page} />
    </div>
  );
}
