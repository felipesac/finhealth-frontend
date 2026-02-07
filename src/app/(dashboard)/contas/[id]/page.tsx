import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Detalhes da Conta | FinHealth',
  description: 'Detalhes da conta medica',
};
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
import { StatusBadge } from '@/components/accounts';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { ArrowLeft, FileText } from 'lucide-react';
import type { MedicalAccount, Procedure } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getAccountData(id: string) {
  const supabase = await createClient();

  const { data: account } = await supabase
    .from('medical_accounts')
    .select(`
      *,
      patient:patients(*),
      health_insurer:health_insurers(*)
    `)
    .eq('id', id)
    .single();

  if (!account) return null;

  const { data: procedures } = await supabase
    .from('procedures')
    .select('*')
    .eq('medical_account_id', id)
    .order('created_at');

  return {
    account: account as MedicalAccount,
    procedures: (procedures || []) as Procedure[],
  };
}

export default async function ContaDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getAccountData(id);

  if (!data) {
    notFound();
  }

  const { account, procedures } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/contas">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{account.account_number}</h1>
          <p className="text-muted-foreground">Detalhes da conta medica</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={account.status} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informacoes Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Paciente</p>
                <p className="font-medium">{account.patient?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Operadora</p>
                <p className="font-medium">{account.health_insurer?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium capitalize">{account.account_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Criacao</p>
                <p className="font-medium">{formatDate(account.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Valores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-xl font-bold">{formatCurrency(account.total_amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aprovado</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(account.approved_amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Glosado</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(account.glosa_amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pago</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(account.paid_amount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {account.tiss_guide_number && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Guia TISS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Numero da Guia</p>
                <p className="font-medium">{account.tiss_guide_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium uppercase">{account.tiss_guide_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Validacao</p>
                <Badge variant={account.tiss_validation_status === 'valid' ? 'default' : 'secondary'}>
                  {account.tiss_validation_status || 'Pendente'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Procedimentos ({procedures.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Codigo TUSS</TableHead>
                <TableHead>Descricao</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Valor Unit.</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {procedures.map((proc) => (
                <TableRow key={proc.id}>
                  <TableCell className="font-mono">{proc.tuss_code || '-'}</TableCell>
                  <TableCell>{proc.description}</TableCell>
                  <TableCell>{proc.quantity}</TableCell>
                  <TableCell>{formatCurrency(proc.unit_price)}</TableCell>
                  <TableCell>{formatCurrency(proc.total_price)}</TableCell>
                  <TableCell>
                    <Badge variant={proc.status === 'pending' ? 'secondary' : 'default'}>
                      {proc.status}
                    </Badge>
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
