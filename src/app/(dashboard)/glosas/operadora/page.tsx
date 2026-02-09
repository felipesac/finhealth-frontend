import type { Metadata } from 'next';
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
import { formatCurrency } from '@/lib/formatters';

export const metadata: Metadata = {
  title: 'Glosas por Operadora | FinHealth',
  description: 'Glosas agrupadas por operadora de saude',
};

async function getGlosasByInsurer() {
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

  const insurerMap = new Map<
    string,
    {
      name: string;
      total: number;
      administrativa: number;
      tecnica: number;
      linear: number;
      accepted: number;
      count: number;
    }
  >();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (glosas || []).forEach((glosa: any) => {
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
        count: 0,
      });
    }

    const data = insurerMap.get(insurerId)!;
    data.total += glosa.glosa_amount || 0;
    data.count += 1;

    if (glosa.glosa_type === 'administrativa') data.administrativa += glosa.glosa_amount || 0;
    if (glosa.glosa_type === 'tecnica') data.tecnica += glosa.glosa_amount || 0;
    if (glosa.glosa_type === 'linear') data.linear += glosa.glosa_amount || 0;

    if (glosa.appeal_status === 'accepted') data.accepted += glosa.glosa_amount || 0;
  });

  return Array.from(insurerMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.total - a.total);
}

export default async function GlosasOperadoraPage() {
  const glosasData = await getGlosasByInsurer();

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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Glosas por Operadora
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Glosas agrupadas por operadora de saude
        </p>
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
                <TableHead className="text-right">Qtd</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {glosasData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma glosa encontrada
                  </TableCell>
                </TableRow>
              ) : (
                glosasData.map((item) => (
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
                    <TableCell className="text-right">{item.count}</TableCell>
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
