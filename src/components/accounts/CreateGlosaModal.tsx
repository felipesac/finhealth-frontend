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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { GlosaType } from '@/types';

interface CreateGlosaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountIds: string[];
  onConfirm: (data: GlosaFormData) => Promise<void>;
}

export interface GlosaFormData {
  glosa_amount: number;
  glosa_type: GlosaType;
  glosa_code: string;
  glosa_description: string;
}

export function CreateGlosaModal({
  open,
  onOpenChange,
  accountIds,
  onConfirm,
}: CreateGlosaModalProps) {
  const [glosaAmount, setGlosaAmount] = useState('');
  const [glosaType, setGlosaType] = useState<GlosaType | ''>('');
  const [glosaCode, setGlosaCode] = useState('');
  const [glosaDescription, setGlosaDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setGlosaAmount('');
    setGlosaType('');
    setGlosaCode('');
    setGlosaDescription('');
    setError('');
  };

  const handleSubmit = async () => {
    setError('');

    if (!glosaAmount || parseFloat(glosaAmount) <= 0) {
      setError('Valor glosado obrigatorio e deve ser maior que zero.');
      return;
    }
    if (!glosaType) {
      setError('Tipo de glosa obrigatorio.');
      return;
    }
    if (!glosaCode.trim()) {
      setError('Codigo da glosa obrigatorio.');
      return;
    }

    setLoading(true);
    try {
      await onConfirm({
        glosa_amount: parseFloat(glosaAmount),
        glosa_type: glosaType,
        glosa_code: glosaCode.trim(),
        glosa_description: glosaDescription.trim(),
      });
      resetForm();
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Erro ao registrar glosa.');
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
          <DialogTitle>Registrar Glosa</DialogTitle>
          <DialogDescription>
            Informe os detalhes da glosa para{' '}
            {accountIds.length === 1
              ? 'a conta selecionada'
              : `as ${accountIds.length} contas selecionadas`}
            .
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="glosa-amount">Valor Glosado (R$)</Label>
            <Input
              id="glosa-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={glosaAmount}
              onChange={(e) => setGlosaAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="glosa-type">Tipo de Glosa</Label>
            <Select
              value={glosaType}
              onValueChange={(v) => setGlosaType(v as GlosaType)}
            >
              <SelectTrigger id="glosa-type">
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="administrativa">Administrativa</SelectItem>
                <SelectItem value="tecnica">Tecnica</SelectItem>
                <SelectItem value="linear">Linear</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="glosa-code">Codigo da Glosa</Label>
            <Input
              id="glosa-code"
              placeholder="Ex: GA001"
              value={glosaCode}
              onChange={(e) => setGlosaCode(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="glosa-description">Motivo / Descricao</Label>
            <Textarea
              id="glosa-description"
              placeholder="Descreva o motivo da glosa..."
              rows={3}
              value={glosaDescription}
              onChange={(e) => setGlosaDescription(e.target.value)}
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
            Registrar Glosa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
