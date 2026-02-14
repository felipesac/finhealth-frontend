import type { Metadata } from 'next';
import Link from 'next/link';
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
import { formatDate } from '@/lib/formatters';

export const metadata: Metadata = {
  title: 'Validacao TISS | FinHealth',
  description: 'Listagem de validacoes TISS',
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  valid: { label: 'Valida', variant: 'default' },
  invalid: { label: 'Invalida', variant: 'destructive' },
  pending: { label: 'Pendente', variant: 'secondary' },
};

interface TissValidationRow {
  id: string;
  tiss_guide_number: string | null;
  tiss_guide_type: string | null;
  account_number: string;
  tiss_validation_status: string | null;
  tiss_validation_errors: unknown;
  created_at: string;
}

async function getValidationData() {
  const supabase = await createClient();

  const { data: accounts } = await supabase
    .from('medical_accounts')
    .select('id, tiss_guide_number, tiss_guide_type, account_number, tiss_validation_status, tiss_validation_errors, created_at')
    .not('tiss_guide_number', 'is', null)
    .order('created_at', { ascending: false });

  const all = (accounts || []) as unknown as TissValidationRow[];

  const countValid = all.filter((a) => a.tiss_validation_status === 'valid').length;
  const countInvalid = all.filter((a) => a.tiss_validation_status === 'invalid').length;
  const countPending = all.filter((a) => !a.tiss_validation_status || a.tiss_validation_status === 'pending').length;

  // Sort: invalid first, then pending, then valid
  const sorted = [...all].sort((a, b) => {
    const order: Record<string, number> = { invalid: 0, pending: 1, valid: 2 };
    const aOrder = order[a.tiss_validation_status || 'pending'] ?? 1;
    const bOrder = order[b.tiss_validation_status || 'pending'] ?? 1;
    return aOrder - bOrder;
  });

  return {
    accounts: sorted,
    metrics: {
      total: all.length,
      valid: countValid,
      invalid: countInvalid,
      pending: countPending,
    },
  };
}

function getErrorCount(errors: unknown): number {
  if (Array.isArray(errors)) return errors.length;
  if (errors && typeof errors === 'object') return Object.keys(errors).length;
  return 0;
}

export default async function TissValidacaoPage() {
  let accounts: TissValidationRow[] = [];
  let metrics = { total: 0, valid: 0, invalid: 0, pending: 0 };
  try {
    const data = await getValidationData();
    accounts = data.accounts;
    metrics = data.metrics;
  } catch {
    // Supabase unavailable — render empty state
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Validacao TISS
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Listagem de validacoes de guias TISS
        </p>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Guias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Validas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.valid}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Invalidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.invalid}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.pending}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Validacoes TISS</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guia</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Erros</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma guia TISS encontrada
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => {
                  const status = account.tiss_validation_status || 'pending';
                  const config = statusConfig[status] || statusConfig.pending;
                  const errorCount = getErrorCount(account.tiss_validation_errors);

                  return (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono font-medium">
                        <Link
                          href={`/tiss/viewer/${account.id}`}
                          className="text-primary hover:underline"
                        >
                          {account.tiss_guide_number}
                        </Link>
                      </TableCell>
                      <TableCell className="uppercase">
                        {account.tiss_guide_type || '-'}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/contas/${account.id}`}
                          className="text-primary hover:underline"
                        >
                          {account.account_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {errorCount > 0 ? (
                          <span className="text-red-600 font-medium">{errorCount}</span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{formatDate(account.created_at)}</TableCell>
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
