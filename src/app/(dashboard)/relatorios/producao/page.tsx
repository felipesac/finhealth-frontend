import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft } from 'lucide-react';
import { ExportButton } from '@/components/reports/ExportButton';
import { formatCurrency } from '@/lib/formatters';

export const metadata: Metadata = {
  title: 'Producao Medica | FinHealth',
  description: 'Relatorio de producao medica por tipo e operadora',
};

const tipoLabels: Record<string, string> = {
  internacao: 'Internacao',
  ambulatorial: 'Ambulatorial',
  sadt: 'SADT',
  honorarios: 'Honorarios',
};

async function getProductionData() {
  const supabase = await createClient();

  const { data: accounts } = await supabase
    .from('medical_accounts')
    .select(`
      account_type,
      total_amount,
      approved_amount,
      paid_amount,
      health_insurer:health_insurers(id, name)
    `);

  const all = accounts || [];

  // Aggregate by type
  const typeMap = new Map<string, { count: number; total: number; approved: number; paid: number }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insurerMap = new Map<string, { name: string; count: number; total: number; paid: number }>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  all.forEach((account: any) => {
    const type = account.account_type || 'outros';
    if (!typeMap.has(type)) {
      typeMap.set(type, { count: 0, total: 0, approved: 0, paid: 0 });
    }
    const td = typeMap.get(type)!;
    td.count += 1;
    td.total += account.total_amount || 0;
    td.approved += account.approved_amount || 0;
    td.paid += account.paid_amount || 0;

    const insurerId = account.health_insurer?.id;
    const insurerName = account.health_insurer?.name;
    if (insurerId && insurerName) {
      if (!insurerMap.has(insurerId)) {
        insurerMap.set(insurerId, { name: insurerName, count: 0, total: 0, paid: 0 });
      }
      const id = insurerMap.get(insurerId)!;
      id.count += 1;
      id.total += account.total_amount || 0;
      id.paid += account.paid_amount || 0;
    }
  });

  const byType = Array.from(typeMap.entries())
    .map(([type, data]) => ({ type, ...data }))
    .sort((a, b) => b.total - a.total);

  const byInsurer = Array.from(insurerMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.total - a.total);

  const totals = all.reduce(
    (acc, a) => ({
      count: acc.count + 1,
      total: acc.total + (a.total_amount || 0),
      approved: acc.approved + (a.approved_amount || 0),
      paid: acc.paid + (a.paid_amount || 0),
    }),
    { count: 0, total: 0, approved: 0, paid: 0 }
  );

  return { byType, byInsurer, totals };
}

export default async function ProducaoPage() {
  const { byType, byInsurer, totals } = await getProductionData();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Link href="/relatorios">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Producao Medica</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Relatorio de producao por tipo e operadora
          </p>
        </div>
        <ExportButton dataType="accounts" />
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Contas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Aprovado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.approved)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.paid)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Producao por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Qtd Contas</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-right">Valor Aprovado</TableHead>
                <TableHead className="text-right">% Aprovacao</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byType.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhuma conta encontrada
                  </TableCell>
                </TableRow>
              ) : (
                byType.map((item) => {
                  const pct = item.total > 0 ? ((item.approved / item.total) * 100).toFixed(1) : '0.0';
                  return (
                    <TableRow key={item.type}>
                      <TableCell className="font-medium">
                        {tipoLabels[item.type] || item.type}
                      </TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(item.approved)}
                      </TableCell>
                      <TableCell className="text-right">{pct}%</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Producao por Operadora</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operadora</TableHead>
                <TableHead className="text-right">Qtd Contas</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-right">Valor Pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byInsurer.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhuma conta encontrada
                  </TableCell>
                </TableRow>
              ) : (
                byInsurer.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(item.paid)}
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
