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

export const metadata: Metadata = {
  title: 'Lotes TISS | FinHealth',
  description: 'Gerenciamento de lotes de guias TISS',
};

interface TissLote {
  id: string;
  account_number: string;
  tiss_guide_number: string | null;
  tiss_guide_type: string | null;
  tiss_validation_status: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  health_insurer: { id: string; name: string } | null;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  validated: { label: 'Validado', variant: 'outline' },
  sent: { label: 'Enviado', variant: 'default' },
  paid: { label: 'Pago', variant: 'default' },
  glosa: { label: 'Glosado', variant: 'destructive' },
};

async function getLotesData() {
  const supabase = await createClient();

  const { data: accounts } = await supabase
    .from('medical_accounts')
    .select(`
      id, account_number, tiss_guide_number, tiss_guide_type, tiss_validation_status,
      total_amount, status, created_at,
      health_insurer:health_insurers(id, name)
    `)
    .not('tiss_guide_number', 'is', null)
    .order('created_at', { ascending: false });

  const all = (accounts || []) as unknown as TissLote[];

  const totalValor = all.reduce((s, a) => s + (a.total_amount || 0), 0);
  const countSent = all.filter((a) => a.status === 'sent').length;
  const countPending = all.filter((a) => a.status === 'pending' || a.status === 'validated').length;

  return {
    lotes: all,
    metrics: {
      total: all.length,
      totalValor,
      enviados: countSent,
      pendentes: countPending,
    },
  };
}

export default async function TissLotesPage() {
  const { lotes, metrics } = await getLotesData();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Lotes TISS
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerenciamento de lotes de guias TISS para envio as operadoras
        </p>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Guias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(metrics.totalValor)}</div>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.pendentes}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guias TISS por Lote</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guia</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Operadora</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma guia TISS encontrada
                  </TableCell>
                </TableRow>
              ) : (
                lotes.map((lote) => {
                  const config = statusConfig[lote.status] || statusConfig.pending;
                  return (
                    <TableRow key={lote.id}>
                      <TableCell className="font-mono font-medium">{lote.tiss_guide_number}</TableCell>
                      <TableCell className="uppercase">{lote.tiss_guide_type || '-'}</TableCell>
                      <TableCell>{lote.account_number}</TableCell>
                      <TableCell>{lote.health_insurer?.name || '-'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(lote.total_amount)}</TableCell>
                      <TableCell>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(lote.created_at)}</TableCell>
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
