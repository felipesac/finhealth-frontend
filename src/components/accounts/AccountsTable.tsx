'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkActions } from '@/components/ui/BulkActions';
import { StatusBadge } from './StatusBadge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpDown, ArrowUp, ArrowDown, FileText } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import type { MedicalAccount } from '@/types';

const accountStatusOptions = [
  { value: 'pending', label: 'Pendente' },
  { value: 'validated', label: 'Validado' },
  { value: 'sent', label: 'Enviado' },
  { value: 'paid', label: 'Pago' },
  { value: 'glosa', label: 'Glosado' },
  { value: 'appeal', label: 'Em Recurso' },
];

interface AccountsTableProps {
  accounts: MedicalAccount[];
}

const typeLabels: Record<string, string> = {
  internacao: 'Internacao',
  ambulatorial: 'Ambulatorial',
  sadt: 'SADT',
  honorarios: 'Honorarios',
};

type SortField = 'account_number' | 'patient_name' | 'insurer_name' | 'total_amount' | 'status' | 'admission_date';

function AccountsTableInner({ accounts }: AccountsTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === sorted.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sorted.map((a) => a.id)));
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    setBulkLoading(true);
    try {
      const res = await fetch('/api/accounts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), action: 'update_status', status }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: `${json.count} conta(s) atualizada(s)` });
        setSelectedIds(new Set());
        router.refresh();
      } else {
        toast({ title: json.error || 'Erro', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erro na operacao em lote', variant: 'destructive' });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Excluir ${selectedIds.size} conta(s) selecionada(s)?`)) return;
    setBulkLoading(true);
    try {
      const res = await fetch('/api/accounts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), action: 'delete' }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: `${json.count} conta(s) excluida(s)` });
        setSelectedIds(new Set());
        router.refresh();
      } else {
        toast({ title: json.error || 'Erro', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erro na operacao em lote', variant: 'destructive' });
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    if (!sortField) return accounts;
    return [...accounts].sort((a, b) => {
      let aVal: string | number | null | undefined;
      let bVal: string | number | null | undefined;

      switch (sortField) {
        case 'account_number':
          aVal = a.account_number;
          bVal = b.account_number;
          break;
        case 'patient_name':
          aVal = a.patient?.name;
          bVal = b.patient?.name;
          break;
        case 'insurer_name':
          aVal = a.health_insurer?.name;
          bVal = b.health_insurer?.name;
          break;
        case 'total_amount':
          aVal = a.total_amount;
          bVal = b.total_amount;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'admission_date':
          aVal = a.admission_date;
          bVal = b.admission_date;
          break;
      }

      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [accounts, sortField, sortDir]);

  const renderSortIcon = (field: SortField) => {
    if (sortField === field) {
      return sortDir === 'asc' ? (
        <ArrowUp className="h-3.5 w-3.5" />
      ) : (
        <ArrowDown className="h-3.5 w-3.5" />
      );
    }
    return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />;
  };

  const isAllSelected = selectedIds.size === sorted.length && sorted.length > 0;

  return (
    <div className="space-y-3">
      <BulkActions
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkUpdateStatus={handleBulkUpdateStatus}
        onBulkDelete={handleBulkDelete}
        statusOptions={accountStatusOptions}
        loading={bulkLoading}
      />
      <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} />
            </TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => toggleSort('account_number')}
              >
                Numero
                {renderSortIcon('account_number')}
              </button>
            </TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => toggleSort('patient_name')}
              >
                Paciente
                {renderSortIcon('patient_name')}
              </button>
            </TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => toggleSort('insurer_name')}
              >
                Operadora
                {renderSortIcon('insurer_name')}
              </button>
            </TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => toggleSort('total_amount')}
              >
                Valor Total
                {renderSortIcon('total_amount')}
              </button>
            </TableHead>
            <TableHead>Glosa</TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => toggleSort('status')}
              >
                Status
                {renderSortIcon('status')}
              </button>
            </TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => toggleSort('admission_date')}
              >
                Data
                {renderSortIcon('admission_date')}
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((account) => (
            <TableRow key={account.id}>
              <TableCell>
                <Checkbox checked={selectedIds.has(account.id)} onCheckedChange={() => toggleSelect(account.id)} />
              </TableCell>
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
              <TableCell colSpan={9}>
                <EmptyState
                  icon={FileText}
                  title="Nenhuma conta encontrada"
                  description="Nao ha contas medicas com os filtros selecionados."
                  actionLabel="Nova Conta"
                  actionHref="/contas/nova"
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}

export const AccountsTable = React.memo(AccountsTableInner);
