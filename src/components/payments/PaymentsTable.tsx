'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ReconciliationBadge } from './ReconciliationBadge';
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Search, X, ArrowUpDown, ArrowUp, ArrowDown, CreditCard } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Payment } from '@/types';

interface PaymentsTableProps {
  payments: Payment[];
}

type SortField = 'payment_date' | 'payment_reference' | 'total_amount' | 'reconciliation_status';

function PaymentsTableInner({ payments }: PaymentsTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [insurerFilter, setInsurerFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const insurers = useMemo(() => {
    const map = new Map<string, string>();
    payments.forEach((p) => {
      if (p.health_insurer) {
        map.set(p.health_insurer_id, p.health_insurer.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [payments]);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (statusFilter !== 'all' && p.reconciliation_status !== statusFilter) return false;
      if (insurerFilter !== 'all' && p.health_insurer_id !== insurerFilter) return false;
      if (search && !(p.payment_reference || '').toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [payments, statusFilter, insurerFilter, search]);

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      let aVal: string | number | null | undefined;
      let bVal: string | number | null | undefined;

      switch (sortField) {
        case 'payment_date':
          aVal = a.payment_date;
          bVal = b.payment_date;
          break;
        case 'payment_reference':
          aVal = a.payment_reference;
          bVal = b.payment_reference;
          break;
        case 'total_amount':
          aVal = a.total_amount;
          bVal = b.total_amount;
          break;
        case 'reconciliation_status':
          aVal = a.reconciliation_status;
          bVal = b.reconciliation_status;
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
  }, [filtered, sortField, sortDir]);

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

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setInsurerFilter('all');
  };

  const tableView = (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <button
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => toggleSort('payment_reference')}
              >
                Referencia
                {renderSortIcon('payment_reference')}
              </button>
            </TableHead>
            <TableHead>Operadora</TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => toggleSort('payment_date')}
              >
                Data Pagamento
                {renderSortIcon('payment_date')}
              </button>
            </TableHead>
            <TableHead className="text-right">
              <button
                className="flex items-center gap-1 hover:text-foreground ml-auto"
                onClick={() => toggleSort('total_amount')}
              >
                Valor Total
                {renderSortIcon('total_amount')}
              </button>
            </TableHead>
            <TableHead className="text-right">Conciliado</TableHead>
            <TableHead className="text-right">Diferenca</TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => toggleSort('reconciliation_status')}
              >
                Status
                {renderSortIcon('reconciliation_status')}
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                <Link
                  href={`/pagamentos/${payment.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {payment.payment_reference || payment.id.slice(0, 8)}
                </Link>
              </TableCell>
              <TableCell>{payment.health_insurer?.name || '-'}</TableCell>
              <TableCell>{formatDate(payment.payment_date)}</TableCell>
              <TableCell className="text-right">{formatCurrency(payment.total_amount)}</TableCell>
              <TableCell className="text-right text-green-600">
                {formatCurrency(payment.matched_amount)}
              </TableCell>
              <TableCell className="text-right">
                {payment.unmatched_amount > 0 ? (
                  <span className="text-red-600">{formatCurrency(payment.unmatched_amount)}</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <ReconciliationBadge status={payment.reconciliation_status} />
              </TableCell>
            </TableRow>
          ))}
          {sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>
                <EmptyState
                  icon={CreditCard}
                  title="Nenhum pagamento encontrado"
                  description="Nao ha pagamentos com os filtros selecionados."
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  const cardsView = (
    <div className="space-y-3">
      {sorted.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Nenhum pagamento encontrado"
          description="Nao ha pagamentos com os filtros selecionados."
        />
      ) : (
        sorted.map((payment) => (
          <Card key={payment.id} data-testid="payment-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/pagamentos/${payment.id}`}
                  className="font-medium text-primary hover:underline truncate"
                >
                  {payment.payment_reference || payment.id.slice(0, 8)}
                </Link>
                <ReconciliationBadge status={payment.reconciliation_status} />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div className="text-muted-foreground">Operadora</div>
                <div className="truncate">{payment.health_insurer?.name || '-'}</div>
                <div className="text-muted-foreground">Data</div>
                <div>{formatDate(payment.payment_date)}</div>
                <div className="text-muted-foreground">Valor Total</div>
                <div>{formatCurrency(payment.total_amount)}</div>
                <div className="text-muted-foreground">Conciliado</div>
                <div className="text-green-600">{formatCurrency(payment.matched_amount)}</div>
                {payment.unmatched_amount > 0 && (
                  <>
                    <div className="text-muted-foreground">Diferenca</div>
                    <div className="text-red-600">{formatCurrency(payment.unmatched_amount)}</div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por referencia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="partial">Parcial</SelectItem>
            <SelectItem value="matched">Conciliado</SelectItem>
            <SelectItem value="divergent">Divergente</SelectItem>
          </SelectContent>
        </Select>

        <Select value={insurerFilter} onValueChange={setInsurerFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Operadora" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {insurers.map((ins) => (
              <SelectItem key={ins.id} value={ins.id}>{ins.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="ghost" size="icon" onClick={resetFilters}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ResponsiveTable table={tableView} cards={cardsView} />
    </div>
  );
}

export const PaymentsTable = React.memo(PaymentsTableInner);
