import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { BpaForm } from '@/components/sus';

export const metadata: Metadata = {
  title: 'BPA - Producao Ambulatorial | FinHealth',
  description: 'Boletim de Producao Ambulatorial SUS',
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

async function getBpaData() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('sus_bpa')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return data || [];
}

export default async function BpaPage() {
  let bpaData: Awaited<ReturnType<typeof getBpaData>> = [];
  try {
    bpaData = await getBpaData();
  } catch {
    // Supabase unavailable — render empty state
  }

  const totals = bpaData.reduce(
    (acc, item) => ({
      count: acc.count + 1,
      valor: acc.valor + (item.valor_total || 0),
      quantidade: acc.quantidade + (item.quantidade || 0),
    }),
    { count: 0, valor: 0, quantidade: 0 }
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Link href="/sus">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">BPA - Producao Ambulatorial</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Boletim de Producao Ambulatorial SUS
          </p>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total BPAs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Procedimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.quantidade}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totals.valor)}
            </div>
          </CardContent>
        </Card>
      </div>

      <BpaForm />

      {bpaData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>BPAs Registrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CNES</TableHead>
                    <TableHead>Competencia</TableHead>
                    <TableHead>CBO</TableHead>
                    <TableHead>Procedimento</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bpaData.map((bpa) => (
                    <TableRow key={bpa.id}>
                      <TableCell className="font-mono text-sm">{bpa.cnes}</TableCell>
                      <TableCell>{bpa.competencia}</TableCell>
                      <TableCell className="font-mono text-sm">{bpa.cbo}</TableCell>
                      <TableCell className="font-mono text-sm">{bpa.procedimento}</TableCell>
                      <TableCell className="text-right">{bpa.quantidade}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(bpa.valor_total || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[bpa.status] || 'secondary'}>
                          {statusLabel[bpa.status] || bpa.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
