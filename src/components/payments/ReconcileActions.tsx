'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Link2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/formatters';

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
      const supabase = createClient();

      // Get current payment state
      const { data: payment, error: fetchError } = await supabase
        .from('payments')
        .select('total_amount, matched_amount, unmatched_amount')
        .eq('id', paymentId)
        .single();

      if (fetchError || !payment) throw new Error('Pagamento nao encontrado');

      const amountToMatch = Math.min(accountAmount, payment.unmatched_amount);
      const newMatched = payment.matched_amount + amountToMatch;
      const newUnmatched = payment.total_amount - newMatched;
      const isFullyMatched = newUnmatched <= 0.01;

      // Update payment
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          matched_amount: newMatched,
          unmatched_amount: Math.max(0, newUnmatched),
          reconciliation_status: isFullyMatched ? 'matched' : 'partial',
          reconciled_at: isFullyMatched ? new Date().toISOString() : null,
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // Update account
      const { error: accountError } = await supabase
        .from('medical_accounts')
        .update({
          paid_amount: amountToMatch,
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', accountId);

      if (accountError) throw accountError;

      toast({
        title: 'Conciliacao realizada',
        description: `${formatCurrency(amountToMatch)} vinculado a esta conta`,
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
    <Button size="sm" variant="outline" onClick={handleReconcile} disabled={reconciling}>
      {reconciling ? (
        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
      ) : (
        <Link2 className="mr-1 h-3 w-3" />
      )}
      Vincular
    </Button>
  );
}
