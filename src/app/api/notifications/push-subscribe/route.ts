import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { z } from 'zod';

const PushSubscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }).nullable(),
});

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'push-subscribe');
    const { success: allowed } = await rateLimit(rlKey, { limit: 10, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'notifications:write');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = PushSubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Dados invalidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { subscription } = parsed.data;

    // Store push subscription in user metadata
    const { error } = await supabase.auth.updateUser({
      data: { push_subscription: subscription },
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({ success: false, error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'push-unsubscribe');
    const { success: allowed } = await rateLimit(rlKey, { limit: 10, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'notifications:write');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { error } = await supabase.auth.updateUser({
      data: { push_subscription: null },
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({ success: false, error: error.message || 'Erro interno' }, { status: 500 });
  }
}
