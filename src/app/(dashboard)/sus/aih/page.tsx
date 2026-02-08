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
import { formatCurrency, formatDate } from '@/lib/formatters';
import { AihForm } from '@/components/sus';

export const metadata: Metadata = {
  title: 'AIH - Internacoes | FinHealth',
  description: 'Autorizacao de Internacao Hospitalar SUS',
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

const tipoAihLabel: Record<string, string> = {
  '1': 'Normal',
  '5': 'Longa Perm.',
};

async function getAihData() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('sus_aih')
    .select('*, patient:patients(id, name)')
    .order('created_at', { ascending: false })
    .limit(100);

  return data || [];
}

export default async function AihPage() {
  const aihData = await getAihData();

  const totals = aihData.reduce(
    (acc, item) => ({
      count: acc.count + 1,
      valor: acc.valor + (item.valor || 0),
      diarias: acc.diarias + (item.diarias || 0),
    }),
    { count: 0, valor: 0, diarias: 0 }
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
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">AIH - Internacoes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Autorizacao de Internacao Hospitalar SUS
          </p>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total AIHs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Diarias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.diarias}</div>
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

      <AihForm />

      {aihData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AIHs Registradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N. AIH</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Proc. Principal</TableHead>
                    <TableHead>Internacao</TableHead>
                    <TableHead>Saida</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aihData.map((aih) => (
                    <TableRow key={aih.id}>
                      <TableCell className="font-mono text-sm">{aih.numero_aih}</TableCell>
                      <TableCell>{tipoAihLabel[aih.tipo_aih] || aih.tipo_aih}</TableCell>
                      <TableCell className="font-mono text-sm">{aih.procedimento_principal}</TableCell>
                      <TableCell>{formatDate(aih.data_internacao)}</TableCell>
                      <TableCell>{aih.data_saida ? formatDate(aih.data_saida) : '-'}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(aih.valor || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[aih.status] || 'secondary'}>
                          {statusLabel[aih.status] || aih.status}
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
