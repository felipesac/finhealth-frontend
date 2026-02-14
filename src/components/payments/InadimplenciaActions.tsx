'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface InadimplenciaActionsProps {
  accountId: string;
  accountNumber: string;
  currentStatus: string;
}

const statusOptions = [
  { value: 'em_cobranca', label: 'Em Cobranca' },
  { value: 'negociado', label: 'Negociado' },
  { value: 'paid', label: 'Pago' },
  { value: 'perdido', label: 'Perda' },
] as const;

export function InadimplenciaActions({ accountId, accountNumber, currentStatus }: InadimplenciaActionsProps) {
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleConfirm = async () => {
    if (!selectedStatus) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          metadata: { inadimplencia_action: selectedStatus, action_date: new Date().toISOString() },
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao atualizar');
      }
      toast({ title: `Conta ${accountNumber} atualizada para ${statusOptions.find((s) => s.value === selectedStatus)?.label}` });
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast({ title: 'Erro ao atualizar conta', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Acao
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acao de Inadimplencia</DialogTitle>
            <DialogDescription>
              Conta {accountNumber} — status atual: {currentStatus}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a acao" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedStatus || loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
