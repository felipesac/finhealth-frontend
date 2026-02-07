'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from './StatusBadge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { MedicalAccount } from '@/types';

interface AccountsTableProps {
  accounts: MedicalAccount[];
}

const typeLabels: Record<string, string> = {
  internacao: 'Internacao',
  ambulatorial: 'Ambulatorial',
  sadt: 'SADT',
  honorarios: 'Honorarios',
};

export function AccountsTable({ accounts }: AccountsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Numero</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead>Operadora</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Valor Total</TableHead>
            <TableHead>Glosa</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
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
              <TableCell>{account.health_insurer?.name || '-'}</TableCell>
              <TableCell>{typeLabels[account.account_type]}</TableCell>
              <TableCell>{formatCurrency(account.total_amount)}</TableCell>
              <TableCell className="text-destructive">
                {account.glosa_amount > 0
                  ? formatCurrency(account.glosa_amount)
                  : '-'}
              </TableCell>
              <TableCell>
                <StatusBadge status={account.status} />
              </TableCell>
              <TableCell>{formatDate(account.created_at)}</TableCell>
            </TableRow>
          ))}
          {accounts.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8" role="status">
                Nenhuma conta encontrada
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
