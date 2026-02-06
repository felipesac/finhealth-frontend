import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentsTable } from '@/components/payments/PaymentsTable';
import { formatCurrency } from '@/lib/formatters';
import type { Payment } from '@/types';

async function getPaymentsData() {
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from('payments')
    .select(`
      *,
      health_insurer:health_insurers(id, name)
    `)
    .order('payment_date', { ascending: false })
    .limit(500);

  return (payments || []) as Payment[];
}

export default async function PagamentosPage() {
  const payments = await getPaymentsData();

  const totalReceived = payments.reduce((s, p) => s + (p.total_amount || 0), 0);
  const totalMatched = payments.reduce((s, p) => s + (p.matched_amount || 0), 0);
  const totalUnmatched = payments.reduce((s, p) => s + (p.unmatched_amount || 0), 0);
  const pendingCount = payments.filter((p) => p.reconciliation_status === 'pending').length;

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
            <div className="text-2xl font-bold">{formatCurrency(totalReceived)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conciliado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalMatched)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Diferenca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalUnmatched)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">pagamentos para conciliar</p>
          </CardContent>
        </Card>
      </div>

      <PaymentsTable payments={payments} />
    </div>
  );
}
