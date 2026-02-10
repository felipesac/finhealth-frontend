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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { BulkActions } from '@/components/ui/BulkActions';
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpDown, ArrowUp, ArrowDown, AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Glosa, AppealStatus, GlosaType } from '@/types';

const glosaStatusOptions = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'sent', label: 'Enviado' },
  { value: 'accepted', label: 'Aceito' },
  { value: 'rejected', label: 'Rejeitado' },
];

interface GlosasTableProps {
  glosas: Glosa[];
}

const appealStatusConfig: Record<AppealStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  in_progress: { label: 'Em Andamento', variant: 'outline' },
  sent: { label: 'Enviado', variant: 'default' },
  accepted: { label: 'Aceito', variant: 'default' },
  rejected: { label: 'Rejeitado', variant: 'destructive' },
};

const glosaTypeLabels: Record<GlosaType, string> = {
  administrativa: 'Administrativa',
  tecnica: 'Tecnica',
  linear: 'Linear',
};

type SortField = 'glosa_code' | 'glosa_type' | 'original_amount' | 'glosa_amount' | 'appeal_status';

function GlosasTableInner({ glosas }: GlosasTableProps) {
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
      setSelectedIds(new Set(sorted.map((g) => g.id)));
    }
  };

  const handleBulkUpdateStatus = async (appeal_status: string) => {
    setBulkLoading(true);
    try {
      const res = await fetch('/api/glosas/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), action: 'update_status', appeal_status }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: `${json.count} glosa(s) atualizada(s)` });
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
    if (!confirm(`Excluir ${selectedIds.size} glosa(s) selecionada(s)?`)) return;
    setBulkLoading(true);
    try {
      const res = await fetch('/api/glosas/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), action: 'delete' }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: `${json.count} glosa(s) excluida(s)` });
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
    if (!sortField) return glosas;
    return [...glosas].sort((a, b) => {
      let aVal: string | number | null | undefined;
      let bVal: string | number | null | undefined;

      switch (sortField) {
        case 'glosa_code':
          aVal = a.glosa_code;
          bVal = b.glosa_code;
          break;
        case 'glosa_type':
          aVal = a.glosa_type;
          bVal = b.glosa_type;
          break;
        case 'original_amount':
          aVal = a.original_amount;
          bVal = b.original_amount;
          break;
        case 'glosa_amount':
          aVal = a.glosa_amount;
          bVal = b.glosa_amount;
          break;
        case 'appeal_status':
          aVal = a.appeal_status;
          bVal = b.appeal_status;
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
  }, [glosas, sortField, sortDir]);

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

  const tableView = (
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
                onClick={() => toggleSort('glosa_code')}
              >
                Codigo
                {renderSortIcon('glosa_code')}
              </button>
            </TableHead>
            <TableHead>Conta</TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => toggleSort('glosa_type')}
              >
                Tipo
                {renderSortIcon('glosa_type')}
              </button>
            </TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => toggleSort('original_amount')}
              >
                Valor Original
                {renderSortIcon('original_amount')}
              </button>
            </TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => toggleSort('glosa_amount')}
              >
                Valor Glosado
                {renderSortIcon('glosa_amount')}
              </button>
            </TableHead>
            <TableHead>Probabilidade</TableHead>
            <TableHead>
              <button
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => toggleSort('appeal_status')}
              >
                Status
                {renderSortIcon('appeal_status')}
              </button>
            </TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((glosa) => {
            const status = appealStatusConfig[glosa.appeal_status];
            return (
              <TableRow key={glosa.id}>
                <TableCell>
                  <Checkbox checked={selectedIds.has(glosa.id)} onCheckedChange={() => toggleSelect(glosa.id)} />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/glosas/${glosa.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {glosa.glosa_code}
                  </Link>
                </TableCell>
                <TableCell>
                  {glosa.medical_account?.account_number || '-'}
                </TableCell>
                <TableCell>
                  {glosa.glosa_type ? glosaTypeLabels[glosa.glosa_type] : '-'}
                </TableCell>
                <TableCell>{formatCurrency(glosa.original_amount)}</TableCell>
                <TableCell className="text-destructive font-medium">
                  {formatCurrency(glosa.glosa_amount)}
                </TableCell>
                <TableCell>
                  {glosa.success_probability !== undefined && (
                    <div className="flex items-center gap-2">
                      <Progress
                        value={glosa.success_probability * 100}
                        className="h-2 w-16"
                        aria-label={`Probabilidade de sucesso: ${(glosa.success_probability * 100).toFixed(0)}%`}
                      />
                      <span className="text-sm">
                        {(glosa.success_probability * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell>{formatDate(glosa.created_at)}</TableCell>
              </TableRow>
            );
          })}
          {glosas.length === 0 && (
            <TableRow>
              <TableCell colSpan={9}>
                <EmptyState
                  icon={AlertCircle}
                  title="Nenhuma glosa encontrada"
                  description="Nao ha glosas com os filtros selecionados."
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
          icon={AlertCircle}
          title="Nenhuma glosa encontrada"
          description="Nao ha glosas com os filtros selecionados."
        />
      ) : (
        sorted.map((glosa) => {
          const status = appealStatusConfig[glosa.appeal_status];
          return (
            <Card key={glosa.id} data-testid="glosa-card">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.has(glosa.id)}
                    onCheckedChange={() => toggleSelect(glosa.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/glosas/${glosa.id}`}
                        className="font-medium text-primary hover:underline truncate"
                      >
                        {glosa.glosa_code}
                      </Link>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <div className="text-muted-foreground">Tipo</div>
                      <div>{glosa.glosa_type ? glosaTypeLabels[glosa.glosa_type] : '-'}</div>
                      <div className="text-muted-foreground">Valor Glosado</div>
                      <div className="text-destructive font-medium">{formatCurrency(glosa.glosa_amount)}</div>
                      <div className="text-muted-foreground">Valor Original</div>
                      <div>{formatCurrency(glosa.original_amount)}</div>
                      <div className="text-muted-foreground">Conta</div>
                      <div>{glosa.medical_account?.account_number || '-'}</div>
                      {glosa.success_probability !== undefined && (
                        <>
                          <div className="text-muted-foreground">Probabilidade</div>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={glosa.success_probability * 100}
                              className="h-2 w-16"
                              aria-label={`Probabilidade de sucesso: ${(glosa.success_probability * 100).toFixed(0)}%`}
                            />
                            <span>{(glosa.success_probability * 100).toFixed(0)}%</span>
                          </div>
                        </>
                      )}
                      <div className="text-muted-foreground">Data</div>
                      <div>{formatDate(glosa.created_at)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <BulkActions
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkUpdateStatus={handleBulkUpdateStatus}
        onBulkDelete={handleBulkDelete}
        statusOptions={glosaStatusOptions}
        loading={bulkLoading}
      />
      <ResponsiveTable table={tableView} cards={cardsView} />
    </div>
  );
}

export const GlosasTable = React.memo(GlosasTableInner);
