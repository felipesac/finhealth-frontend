'use client';

import { useMemo, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ReconciliationBadge } from './ReconciliationBadge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Search, X } from 'lucide-react';
import type { Payment } from '@/types';

interface PaymentsTableProps {
  payments: Payment[];
}

export function PaymentsTable({ payments }: PaymentsTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [insurerFilter, setInsurerFilter] = useState('all');

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

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setInsurerFilter('all');
  };

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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Referencia</TableHead>
              <TableHead>Operadora</TableHead>
              <TableHead>Data Pagamento</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead className="text-right">Conciliado</TableHead>
              <TableHead className="text-right">Diferenca</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((payment) => (
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
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum pagamento encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
