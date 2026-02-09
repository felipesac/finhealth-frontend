import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Glosas por Operadora | FinHealth',
  description: 'Analise de glosas agrupadas por operadora de saude',
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

async function getGlosasData() {
  const supabase = await createClient();

  const { data: glosas } = await supabase
    .from('glosas')
    .select(`
      glosa_amount,
      glosa_type,
      appeal_status,
      medical_account:medical_accounts(
        health_insurer:health_insurers(id, name)
      )
    `);

  interface GlosaWithInsurer {
    glosa_amount: number;
    glosa_type: string | null;
    appeal_status: string | null;
    medical_account: { health_insurer: { id: string; name: string } | null } | null;
  }

  // Aggregate by insurer
  const insurerMap = new Map<
    string,
    {
      name: string;
      total: number;
      administrativa: number;
      tecnica: number;
      linear: number;
      accepted: number;
      rejected: number;
    }
  >();

  ((glosas || []) as unknown as GlosaWithInsurer[]).forEach((glosa) => {
    const insurerId = glosa.medical_account?.health_insurer?.id;
    const insurerName = glosa.medical_account?.health_insurer?.name;

    if (!insurerId || !insurerName) return;

    if (!insurerMap.has(insurerId)) {
      insurerMap.set(insurerId, {
        name: insurerName,
        total: 0,
        administrativa: 0,
        tecnica: 0,
        linear: 0,
        accepted: 0,
        rejected: 0,
      });
    }

    const data = insurerMap.get(insurerId)!;
    data.total += glosa.glosa_amount || 0;

    if (glosa.glosa_type === 'administrativa') data.administrativa += glosa.glosa_amount || 0;
    if (glosa.glosa_type === 'tecnica') data.tecnica += glosa.glosa_amount || 0;
    if (glosa.glosa_type === 'linear') data.linear += glosa.glosa_amount || 0;

    if (glosa.appeal_status === 'accepted') data.accepted += glosa.glosa_amount || 0;
    if (glosa.appeal_status === 'rejected') data.rejected += glosa.glosa_amount || 0;
  });

  return Array.from(insurerMap.entries()).map(([id, data]) => ({
    id,
    ...data,
  }));
}

export default async function GlosasOperadoraPage() {
  const glosasData = await getGlosasData();

  const totals = glosasData.reduce(
    (acc, item) => ({
      total: acc.total + item.total,
      administrativa: acc.administrativa + item.administrativa,
      tecnica: acc.tecnica + item.tecnica,
      linear: acc.linear + item.linear,
    }),
    { total: 0, administrativa: 0, tecnica: 0, linear: 0 }
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
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Glosas por Operadora</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Analise de glosas agrupadas por operadora
          </p>
        </div>
        <ExportButton dataType="glosas" />
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Glosado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totals.total)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Administrativa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.administrativa)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tecnica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.tecnica)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Linear</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.linear)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Glosas por Operadora</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operadora</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Administrativa</TableHead>
                <TableHead className="text-right">Tecnica</TableHead>
                <TableHead className="text-right">Linear</TableHead>
                <TableHead className="text-right">Recuperado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {glosasData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right text-red-600">
                    {formatCurrency(item.total)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.administrativa)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.tecnica)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.linear)}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatCurrency(item.accepted)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
