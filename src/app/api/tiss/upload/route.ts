import { NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = 'https://n8n.noxtec.com.br/webhook/tiss-upload';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { xml, accountId } = body;

    if (!xml) {
      return NextResponse.json(
        { success: false, error: 'Campo obrigatorio: xml' },
        { status: 400 }
      );
    }

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
