import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, accountId } = body as {
      paymentId: string;
      accountId: string;
    };

    if (!paymentId || !accountId) {
      return NextResponse.json({ error: 'Campos obrigatorios: paymentId, accountId' }, { status: 400 });
    }

    // Get current payment state
    const { data: payment, error: paymentFetchError } = await supabase
      .from('payments')
      .select('total_amount, matched_amount, unmatched_amount')
      .eq('id', paymentId)
      .single();

    if (paymentFetchError || !payment) {
      return NextResponse.json({ error: 'Pagamento nao encontrado' }, { status: 404 });
    }

    // Get account state
    const { data: account, error: accountFetchError } = await supabase
      .from('medical_accounts')
      .select('total_amount, paid_amount')
      .eq('id', accountId)
      .single();

    if (accountFetchError || !account) {
      return NextResponse.json({ error: 'Conta nao encontrada' }, { status: 404 });
    }

    const accountRemaining = account.total_amount - (account.paid_amount || 0);
    const amountToMatch = Math.min(accountRemaining, payment.unmatched_amount);

    if (amountToMatch <= 0) {
      return NextResponse.json({ error: 'Nenhum valor disponivel para conciliacao' }, { status: 400 });
    }

    const newMatched = (payment.matched_amount || 0) + amountToMatch;
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
        paid_amount: (account.paid_amount || 0) + amountToMatch,
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', accountId);

    if (accountError) {
      // Rollback payment update
      await supabase
        .from('payments')
        .update({
          matched_amount: payment.matched_amount,
          unmatched_amount: payment.unmatched_amount,
          reconciliation_status: payment.matched_amount > 0 ? 'partial' : 'pending',
          reconciled_at: null,
        })
        .eq('id', paymentId);

      throw accountError;
    }

    return NextResponse.json({
      success: true,
      amountMatched: amountToMatch,
      message: 'Conciliacao realizada com sucesso',
    });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json(
      { error: error.message || 'Erro na conciliacao' },
      { status: 500 }
    );
  }
}
