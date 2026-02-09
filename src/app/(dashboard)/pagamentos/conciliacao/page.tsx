import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ReconciliationBadge } from '@/components/payments/ReconciliationBadge';
import { formatCurrency } from '@/lib/formatters';

export const metadata: Metadata = {
  title: 'Conciliacao Bancaria | FinHealth',
  description: 'Listagem de conciliacoes bancarias',
};

async function getReconciliationData() {
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from('payments')
    .select(`
      id,
      payment_date,
      payment_reference,
      total_amount,
      matched_amount,
      unmatched_amount,
      reconciliation_status,
      reconciled_at,
      health_insurer:health_insurers(id, name)
    `)
    .order('reconciliation_status', { ascending: true })
    .order('payment_date', { ascending: false });

  const all = payments || [];

  const totalAmount = all.reduce((s, p) => s + (p.total_amount || 0), 0);
  const totalMatched = all.reduce((s, p) => s + (p.matched_amount || 0), 0);
  const countMatched = all.filter((p) => p.reconciliation_status === 'matched').length;
  const countPartial = all.filter((p) => p.reconciliation_status === 'partial').length;
  const countPending = all.filter((p) => p.reconciliation_status === 'pending').length;
  const percentConciliado = totalAmount > 0
    ? ((totalMatched / totalAmount) * 100).toFixed(1)
    : '0.0';

  return {
    payments: all,
    metrics: {
      total: all.length,
      matched: countMatched,
      partial: countPartial,
      pending: countPending,
      percentConciliado,
    },
  };
}

export default async function ConciliacaoPage() {
  const { payments, metrics } = await getReconciliationData();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Conciliacao Bancaria
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Listagem de conciliacoes bancarias
        </p>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conciliados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.matched}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Parciais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.partial}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.pending}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pagamentos - Conciliacao</CardTitle>
            <span className="text-sm text-muted-foreground">
              {metrics.percentConciliado}% conciliado
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead>Operadora</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-right">Conciliado</TableHead>
                <TableHead className="text-right">Diferenca</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum pagamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                payments.map((payment: any) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.payment_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/pagamentos/${payment.id}`}
                        className="text-primary hover:underline"
                      >
                        {payment.payment_reference || '-'}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">
                      {payment.health_insurer?.name || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payment.total_amount || 0)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(payment.matched_amount || 0)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(payment.unmatched_amount || 0)}
                    </TableCell>
                    <TableCell>
                      <ReconciliationBadge status={payment.reconciliation_status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
