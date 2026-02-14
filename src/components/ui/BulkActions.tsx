'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';

interface BulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkUpdateStatus: (status: string) => void;
  onBulkDelete: () => void;
  statusOptions: { value: string; label: string }[];
  loading?: boolean;
}

export function BulkActions({
  selectedCount,
  onClearSelection,
  onBulkUpdateStatus,
  onBulkDelete,
  statusOptions,
  loading,
}: BulkActionsProps) {
  const [selectedStatus, setSelectedStatus] = useState('');

  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
      <span className="text-sm font-medium">{selectedCount} selecionado(s)</span>
      <Button variant="ghost" size="sm" onClick={onClearSelection}>
        <X className="mr-1 h-3.5 w-3.5" /> Limpar
      </Button>
      <div className="flex items-center gap-2">
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px] h-8 text-sm">
            <SelectValue placeholder="Alterar status..." />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          disabled={!selectedStatus || loading}
          onClick={() => {
            onBulkUpdateStatus(selectedStatus);
            setSelectedStatus('');
          }}
        >
          <RefreshCw className="mr-1 h-3.5 w-3.5" /> Aplicar
        </Button>
      </div>
      <Button size="sm" variant="destructive" disabled={loading} onClick={onBulkDelete}>
        <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir
      </Button>
    </div>
  );
}
