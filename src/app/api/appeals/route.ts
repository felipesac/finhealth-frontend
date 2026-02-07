import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { glosaId, text, action } = body as {
      glosaId: string;
      text: string;
      action: 'save_draft' | 'submit';
    };

    if (!glosaId || !text?.trim()) {
      return NextResponse.json({ error: 'Campos obrigatorios: glosaId, text' }, { status: 400 });
    }

    if (action === 'submit') {
      const { error } = await supabase
        .from('glosas')
        .update({
          appeal_text: text,
          appeal_status: 'sent',
          appeal_sent_at: new Date().toISOString(),
        })
        .eq('id', glosaId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Recurso enviado com sucesso' });
    }

    // save_draft
    const { error } = await supabase
      .from('glosas')
      .update({
        appeal_text: text,
        appeal_status: 'in_progress',
      })
      .eq('id', glosaId);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Rascunho salvo com sucesso' });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json(
      { error: error.message || 'Erro ao processar recurso' },
      { status: 500 }
    );
  }
}
