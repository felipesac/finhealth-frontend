import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Detalhes do Pagamento | FinHealth',
  description: 'Detalhes do pagamento e conciliacao',
};
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReconciliationBadge } from '@/components/payments/ReconciliationBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { ArrowLeft } from 'lucide-react';
import { ReconcileActions } from '@/components/payments/ReconcileActions';
import type { Payment, MedicalAccount } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getPaymentDetail(id: string) {
  const supabase = await createClient();

  const { data: payment } = await supabase
    .from('payments')
    .select(`
      *,
      health_insurer:health_insurers(id, name, ans_code)
    `)
    .eq('id', id)
    .single();

  if (!payment) return { payment: null, matchableAccounts: [] };

  // Get accounts from same insurer that could be matched
  const { data: accounts } = await supabase
    .from('medical_accounts')
    .select('id, account_number, total_amount, paid_amount, status, created_at')
    .eq('health_insurer_id', payment.health_insurer_id)
    .in('status', ['sent', 'validated', 'pending'])
    .order('created_at', { ascending: false })
    .limit(50);

  return {
    payment: payment as Payment,
    matchableAccounts: (accounts || []) as MedicalAccount[],
  };
}

export default async function PaymentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { payment, matchableAccounts } = await getPaymentDetail(id);

  if (!payment) {
    notFound();
  }

  const matchPercentage = payment.total_amount > 0
    ? (payment.matched_amount / payment.total_amount) * 100
    : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Link href="/pagamentos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Pagamento {payment.payment_reference || payment.id.slice(0, 8)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {payment.health_insurer?.name || 'Operadora nao identificada'}
          </p>
        </div>
        <div>
          <ReconciliationBadge status={payment.reconciliation_status} />
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Referencia</p>
                <p className="font-medium">{payment.payment_reference || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data Pagamento</p>
                <p className="font-medium">{formatDate(payment.payment_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conta Bancaria</p>
                <p className="font-medium">{payment.bank_account || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Operadora</p>
                <p className="font-medium">{payment.health_insurer?.name || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conciliacao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-xl font-bold">{formatCurrency(payment.total_amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Conciliado</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(payment.matched_amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Diferenca</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(payment.unmatched_amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">% Conciliado</p>
                <p className="text-xl font-bold">{matchPercentage.toFixed(1)}%</p>
              </div>
            </div>
            {payment.reconciled_at && (
              <p className="text-sm text-muted-foreground">
                Conciliado em {formatDate(payment.reconciled_at)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {payment.reconciliation_status !== 'matched' && matchableAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Contas para Conciliacao</CardTitle>
            <CardDescription>
              Contas da mesma operadora disponiveis para vincular a este pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-right">Ja Pago</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Acao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matchableAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.account_number}</TableCell>
                    <TableCell className="text-right">{formatCurrency(account.total_amount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(account.paid_amount)}</TableCell>
                    <TableCell className="capitalize">{account.status}</TableCell>
                    <TableCell>{formatDate(account.created_at)}</TableCell>
                    <TableCell>
                      <ReconcileActions
                        paymentId={payment.id}
                        accountId={account.id}
                        accountAmount={account.total_amount - account.paid_amount}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
