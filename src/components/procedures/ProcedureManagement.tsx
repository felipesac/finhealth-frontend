'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/formatters';
import { Loader2, Plus, Trash2 } from 'lucide-react';

interface Procedure {
  id: string;
  tuss_code?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  professional_name?: string;
  status: string;
}

interface ProcedureManagementProps {
  accountId: string;
}

export function ProcedureManagement({ accountId }: ProcedureManagementProps) {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState('');
  const [tussCode, setTussCode] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [professionalName, setProfessionalName] = useState('');
  const { toast } = useToast();

  const fetchProcedures = useCallback(async () => {
    try {
      const res = await fetch(`/api/procedures?account_id=${accountId}`);
      const json = await res.json();
      if (json.success) setProcedures(json.data);
    } catch {
      toast({ title: 'Erro ao carregar procedimentos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [accountId, toast]);

  useEffect(() => {
    fetchProcedures();
  }, [fetchProcedures]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/procedures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medical_account_id: accountId,
          description,
          tuss_code: tussCode || undefined,
          quantity,
          unit_price: unitPrice,
          total_price: quantity * unitPrice,
          professional_name: professionalName || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Procedimento criado' });
        setShowForm(false);
        setDescription('');
        setTussCode('');
        setQuantity(1);
        setUnitPrice(0);
        setProfessionalName('');
        fetchProcedures();
      } else {
        toast({ title: json.error || 'Erro ao criar', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erro ao criar procedimento', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este procedimento?')) return;
    try {
      const res = await fetch(`/api/procedures/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Procedimento excluido' });
        fetchProcedures();
      } else {
        toast({ title: json.error || 'Erro ao excluir', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erro ao excluir procedimento', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Procedimentos ({procedures.length})</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-4 w-4" /> Novo Procedimento
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="proc-desc">Descricao *</Label>
            <Input id="proc-desc" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="proc-tuss">Codigo TUSS</Label>
            <Input id="proc-tuss" value={tussCode} onChange={(e) => setTussCode(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="proc-prof">Profissional</Label>
            <Input id="proc-prof" value={professionalName} onChange={(e) => setProfessionalName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="proc-qty">Quantidade</Label>
            <Input id="proc-qty" type="number" min={1} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="proc-price">Valor Unitario</Label>
            <Input id="proc-price" type="number" min={0} step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)} />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar
            </Button>
          </div>
        </form>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Codigo TUSS</TableHead>
            <TableHead>Descricao</TableHead>
            <TableHead>Qtd</TableHead>
            <TableHead>Valor Unit.</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Profissional</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
              </TableCell>
            </TableRow>
          ) : procedures.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                Nenhum procedimento cadastrado
              </TableCell>
            </TableRow>
          ) : (
            procedures.map((proc) => (
              <TableRow key={proc.id}>
                <TableCell className="font-mono">{proc.tuss_code || '-'}</TableCell>
                <TableCell>{proc.description}</TableCell>
                <TableCell>{proc.quantity}</TableCell>
                <TableCell>{formatCurrency(proc.unit_price)}</TableCell>
                <TableCell>{formatCurrency(proc.total_price)}</TableCell>
                <TableCell>{proc.professional_name || '-'}</TableCell>
                <TableCell>
                  <Badge variant={proc.status === 'pending' ? 'secondary' : 'default'}>{proc.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(proc.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
