'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Link2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/formatters';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ReconcileActionsProps {
  paymentId: string;
  accountId: string;
  accountAmount: number;
}

export function ReconcileActions({ paymentId, accountId, accountAmount }: ReconcileActionsProps) {
  const [reconciling, setReconciling] = useState(false);
  const router = useRouter();

  const handleReconcile = async () => {
    setReconciling(true);
    try {
      const res = await fetch('/api/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, accountId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na conciliacao');

      toast({
        title: 'Conciliacao realizada',
        description: `${formatCurrency(data.amountMatched || accountAmount)} vinculado a esta conta`,
      });

      router.refresh();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast({
        title: 'Erro na conciliacao',
        description: error.message || 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setReconciling(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={reconciling}>
          {reconciling ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Link2 className="mr-1 h-3 w-3" />
          )}
          Vincular
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar conciliacao</AlertDialogTitle>
          <AlertDialogDescription>
            Vincular pagamento de {formatCurrency(accountAmount)} a esta conta? Esta acao atualizara o status do pagamento e da conta.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleReconcile}>
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
