import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Faturamento Mensal | FinHealth',
  description: 'Relatorio de faturamento por periodo e operadora',
};
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

async function getBillingData() {
  const supabase = await createClient();

  const [insurersRes, accountsRes, glosasRes, paymentsRes] = await Promise.all([
    supabase.from('health_insurers').select('id, name'),
    supabase.from('medical_accounts').select('id, health_insurer_id, total_amount'),
    supabase.from('glosas').select('medical_account_id, glosa_amount'),
    supabase.from('payments').select('health_insurer_id, total_amount'),
  ]);

  const insurers = insurersRes.data || [];
  const accounts = accountsRes.data || [];
  const glosas = glosasRes.data || [];
  const payments = paymentsRes.data || [];

  // Map account id → health_insurer_id for glosa aggregation
  const accountInsurer = new Map<string, string>();
  accounts.forEach((a) => {
    if (a.health_insurer_id) accountInsurer.set(a.id, a.health_insurer_id);
  });

  // Aggregate by insurer
  const insurerMap = new Map<string, { name: string; total: number; glosa: number; paid: number }>();

  insurers.forEach((insurer) => {
    insurerMap.set(insurer.id, { name: insurer.name, total: 0, glosa: 0, paid: 0 });
  });

  accounts.forEach((account) => {
    if (account.health_insurer_id && insurerMap.has(account.health_insurer_id)) {
      insurerMap.get(account.health_insurer_id)!.total += account.total_amount || 0;
    }
  });

  glosas.forEach((g) => {
    const insurerId = g.medical_account_id ? accountInsurer.get(g.medical_account_id) : null;
    if (insurerId && insurerMap.has(insurerId)) {
      insurerMap.get(insurerId)!.glosa += g.glosa_amount || 0;
    }
  });

  payments.forEach((p) => {
    if (p.health_insurer_id && insurerMap.has(p.health_insurer_id)) {
      insurerMap.get(p.health_insurer_id)!.paid += p.total_amount || 0;
    }
  });

  return Array.from(insurerMap.entries()).map(([id, data]) => ({
    id,
    ...data,
  }));
}

export default async function FaturamentoPage() {
  let billingData: Awaited<ReturnType<typeof getBillingData>> = [];
  try {
    billingData = await getBillingData();
  } catch {
    // Supabase unavailable — render empty state
  }

  const totals = billingData.reduce(
    (acc, item) => ({
      total: acc.total + item.total,
      glosa: acc.glosa + item.glosa,
      paid: acc.paid + item.paid,
    }),
    { total: 0, glosa: 0, paid: 0 }
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Link href="/relatorios">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Faturamento Mensal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Relatorio de faturamento por operadora
          </p>
        </div>
        <ExportButton dataType="accounts" />
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Faturado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Glosado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totals.glosa)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
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
          <CardTitle>Faturamento por Operadora</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operadora</TableHead>
                <TableHead className="text-right">Faturado</TableHead>
                <TableHead className="text-right">Glosado</TableHead>
                <TableHead className="text-right">Pago</TableHead>
                <TableHead className="text-right">% Glosa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billingData.map((item) => {
                const glosaPercentage =
                  item.total > 0 ? (item.glosa / item.total) * 100 : 0;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.total)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(item.glosa)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(item.paid)}
                    </TableCell>
                    <TableCell className="text-right">
                      {glosaPercentage.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
