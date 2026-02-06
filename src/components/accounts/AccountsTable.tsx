'use client';

import { useMemo } from 'react';
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
import { useFiltersStore } from '@/stores/filters-store';
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
  const { accounts: filters } = useFiltersStore();

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      if (filters.status !== 'all' && a.status !== filters.status) return false;
      if (filters.type !== 'all' && a.account_type !== filters.type) return false;
      if (filters.insurerId !== 'all' && a.health_insurer_id !== filters.insurerId) return false;
      if (filters.search && !a.account_number.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [accounts, filters]);

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
          {filtered.map((account) => (
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
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                Nenhuma conta encontrada
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
