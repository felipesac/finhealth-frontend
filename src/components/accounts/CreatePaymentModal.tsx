'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface CreatePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountIds: string[];
  onConfirm: (data: PaymentFormData) => Promise<void>;
}

export interface PaymentFormData {
  total_amount: number;
  payment_date: string;
  payment_reference: string;
}

export function CreatePaymentModal({
  open,
  onOpenChange,
  accountIds,
  onConfirm,
}: CreatePaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setReference('');
    setError('');
  };

  const handleSubmit = async () => {
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Valor pago obrigatorio e deve ser maior que zero.');
      return;
    }
    if (!paymentDate) {
      setError('Data do pagamento obrigatoria.');
      return;
    }

    setLoading(true);
    try {
      await onConfirm({
        total_amount: parseFloat(amount),
        payment_date: paymentDate,
        payment_reference: reference.trim(),
      });
      resetForm();
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Erro ao registrar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>
            Informe os detalhes do pagamento para{' '}
            {accountIds.length === 1
              ? 'a conta selecionada'
              : `as ${accountIds.length} contas selecionadas`}
            .
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="payment-amount">Valor Pago (R$)</Label>
            <Input
              id="payment-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-date">Data do Pagamento</Label>
            <Input
              id="payment-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-reference">Referencia / Observacao</Label>
            <Textarea
              id="payment-reference"
              placeholder="Numero do lote, observacoes..."
              rows={2}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
