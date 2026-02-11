import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { formatCurrency } from '@/lib/formatters';

export const metadata: Metadata = {
  title: 'Remessa SUS | FinHealth',
  description: 'Gerenciamento de remessas para o SUS',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  rascunho: 'secondary',
  validado: 'outline',
  enviado: 'default',
  aprovado: 'default',
  rejeitado: 'destructive',
};

const statusLabel: Record<string, string> = {
  rascunho: 'Rascunho',
  validado: 'Validado',
  enviado: 'Enviado',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
};

async function getRemessaData() {
  const supabase = await createClient();

  const { data: bpa } = await supabase
    .from('sus_bpa')
    .select('id, competencia, status, valor_total, quantidade, created_at')
    .order('competencia', { ascending: false })
    .limit(100);

  const { data: aih } = await supabase
    .from('sus_aih')
    .select('id, competencia, status, valor_total, created_at')
    .order('competencia', { ascending: false })
    .limit(100);

  const allBpa = bpa || [];
  const allAih = aih || [];

  const bpaByCompetencia = allBpa.reduce<Record<string, { count: number; valor: number; status: string }>>((acc, item) => {
    const key = item.competencia || 'sem-competencia';
    if (!acc[key]) acc[key] = { count: 0, valor: 0, status: item.status || 'rascunho' };
    acc[key].count += 1;
    acc[key].valor += item.valor_total || 0;
    return acc;
  }, {});

  const totalBpa = allBpa.reduce((s, b) => s + (b.valor_total || 0), 0);
  const totalAih = allAih.reduce((s, a) => s + (a.valor_total || 0), 0);
  const countEnviados = [...allBpa, ...allAih].filter((i) => i.status === 'enviado' || i.status === 'aprovado').length;

  return {
    remessas: Object.entries(bpaByCompetencia).map(([competencia, data]) => ({
      competencia,
      tipo: 'BPA',
      quantidade: data.count,
      valor: data.valor,
      status: data.status,
    })),
    metrics: {
      totalBpa,
      totalAih,
      totalRegistros: allBpa.length + allAih.length,
      enviados: countEnviados,
    },
  };
}

export default async function RemessaSusPage() {
  let remessas: Awaited<ReturnType<typeof getRemessaData>>['remessas'] = [];
  let metrics = { totalBpa: 0, totalAih: 0, totalRegistros: 0, enviados: 0 };
  try {
    const data = await getRemessaData();
    remessas = data.remessas;
    metrics = data.metrics;
  } catch {
    // Supabase unavailable — render empty state
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Link href="/sus">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Remessa SUS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerenciamento de remessas BPA e AIH para o SUS
          </p>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalRegistros}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor BPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(metrics.totalBpa)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor AIH</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(metrics.totalAih)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enviados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.enviados}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Remessas por Competencia</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competencia</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Registros</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {remessas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhuma remessa encontrada
                  </TableCell>
                </TableRow>
              ) : (
                remessas.map((remessa) => (
                  <TableRow key={`${remessa.competencia}-${remessa.tipo}`}>
                    <TableCell className="font-medium">{remessa.competencia}</TableCell>
                    <TableCell>{remessa.tipo}</TableCell>
                    <TableCell className="text-right">{remessa.quantidade}</TableCell>
                    <TableCell className="text-right">{formatCurrency(remessa.valor)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[remessa.status] || 'secondary'}>
                        {statusLabel[remessa.status] || remessa.status}
                      </Badge>
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
