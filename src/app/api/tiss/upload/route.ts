import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { tissUploadSchema } from '@/lib/validations';

const N8N_WEBHOOK_URL = process.env.N8N_TISS_WEBHOOK_URL;

export async function POST(request: Request) {
  try {
    if (!N8N_WEBHOOK_URL) {
      return NextResponse.json(
        { success: false, error: 'N8N_TISS_WEBHOOK_URL nao configurado' },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Nao autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = tissUploadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { xml, accountId } = parsed.data;

    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ xml, accountId }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      return NextResponse.json(
        { success: false, error: `Erro no webhook n8n: ${n8nResponse.status}`, details: errorText },
        { status: n8nResponse.status }
      );
    }

    const result = await n8nResponse.json();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao processar upload TISS' },
      { status: 500 }
    );
  }
}
