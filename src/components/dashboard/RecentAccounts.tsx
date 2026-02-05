'use client';

import Link from 'next/link';
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
import type { MedicalAccount, AccountStatus } from '@/types';

interface RecentAccountsProps {
  accounts: MedicalAccount[];
}

const statusConfig: Record<AccountStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  validated: { label: 'Validada', variant: 'outline' },
  sent: { label: 'Enviada', variant: 'default' },
  paid: { label: 'Paga', variant: 'default' },
  glosa: { label: 'Glosada', variant: 'destructive' },
  appeal: { label: 'Em Recurso', variant: 'secondary' },
};

export function RecentAccounts({ accounts }: RecentAccountsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contas Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numero</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => {
              const status = statusConfig[account.status];
              return (
                <TableRow key={account.id}>
                  <TableCell>
                    <Link
                      href={`/contas/${account.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {account.account_number}
                    </Link>
                  </TableCell>
                  <TableCell>{account.patient?.name || '-'}</TableCell>
                  <TableCell>{formatCurrency(account.total_amount)}</TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(account.created_at)}</TableCell>
                </TableRow>
              );
            })}
            {accounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhuma conta encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
