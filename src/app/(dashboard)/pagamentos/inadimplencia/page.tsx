import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { InadimplenciaActions } from '@/components/payments/InadimplenciaActions';

export const metadata: Metadata = {
  title: 'Inadimplencia | FinHealth',
  description: 'Acompanhamento de contas com pagamento em atraso',
};

interface OverdueAccount {
  id: string;
  account_number: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  created_at: string;
  health_insurer: { id: string; name: string } | null;
  patient: { id: string; name: string } | null;
}

async function getOverdueData() {
  const supabase = await createClient();

  const { data: accounts } = await supabase
    .from('medical_accounts')
    .select(`
      id, account_number, total_amount, paid_amount, status, created_at,
      health_insurer:health_insurers(id, name),
      patient:patients(id, name)
    `)
    .in('status', ['validated', 'sent', 'glosa'])
    .order('created_at', { ascending: true });

  const all = (accounts || []) as unknown as OverdueAccount[];

  const now = new Date();
  const overdue = all.filter((a) => {
    const created = new Date(a.created_at);
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 30;
  });

  const totalPendente = overdue.reduce((s, a) => s + (a.total_amount - a.paid_amount), 0);
  const byInsurer = overdue.reduce<Record<string, number>>((acc, a) => {
    const name = a.health_insurer?.name || 'Sem operadora';
    acc[name] = (acc[name] || 0) + (a.total_amount - a.paid_amount);
    return acc;
  }, {});
  const topInsurer = Object.entries(byInsurer).sort(([, a], [, b]) => b - a)[0];

  return {
    accounts: overdue,
    metrics: {
      total: overdue.length,
      totalPendente,
      topInsurer: topInsurer ? topInsurer[0] : '-',
      mediaAtraso: overdue.length > 0
        ? Math.round(overdue.reduce((s, a) => {
            const diffDays = Math.floor((now.getTime() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24));
            return s + diffDays;
          }, 0) / overdue.length)
        : 0,
    },
  };
}

function getDaysOverdue(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
}

function getUrgencyVariant(days: number): 'default' | 'secondary' | 'destructive' {
  if (days > 90) return 'destructive';
  if (days > 60) return 'default';
  return 'secondary';
}

export default async function InadimplenciaPage() {
  const { accounts, metrics } = await getOverdueData();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Inadimplencia
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Contas com pagamento pendente ha mais de 30 dias
        </p>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contas em Atraso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalPendente)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Maior Devedora</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{metrics.topInsurer}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Media de Atraso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.mediaAtraso} dias</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contas Inadimplentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conta</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Operadora</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-right">Pago</TableHead>
                <TableHead className="text-right">Pendente</TableHead>
                <TableHead>Atraso</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Nenhuma conta inadimplente encontrada
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => {
                  const days = getDaysOverdue(account.created_at);
                  const pendente = account.total_amount - account.paid_amount;
                  return (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.account_number}</TableCell>
                      <TableCell>{account.patient?.name || '-'}</TableCell>
                      <TableCell>{account.health_insurer?.name || '-'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(account.total_amount)}</TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(account.paid_amount)}</TableCell>
                      <TableCell className="text-right text-red-600 font-medium">{formatCurrency(pendente)}</TableCell>
                      <TableCell>
                        <Badge variant={getUrgencyVariant(days)}>{days} dias</Badge>
                      </TableCell>
                      <TableCell>{formatDate(account.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <InadimplenciaActions
                          accountId={account.id}
                          accountNumber={account.account_number}
                          currentStatus={account.status}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
