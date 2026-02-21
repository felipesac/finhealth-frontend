import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { z } from 'zod';

const PreferencesSchema = z.object({
  email_glosas: z.boolean().optional(),
  email_pagamentos: z.boolean().optional(),
  email_contas: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
});

export interface NotificationPreferences {
  email_glosas: boolean;
  email_pagamentos: boolean;
  email_contas: boolean;
  push_enabled: boolean;
}

const defaultPreferences: NotificationPreferences = {
  email_glosas: true,
  email_pagamentos: true,
  email_contas: false,
  push_enabled: false,
};

export async function GET(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'notif-prefs-read');
    const { success: allowed } = await rateLimit(rlKey, { limit: 30, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'notifications:read');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { data: { user } } = await supabase.auth.getUser();
    const prefs = user?.user_metadata?.notification_preferences as Partial<NotificationPreferences> | undefined;

    return NextResponse.json({
      success: true,
      data: { ...defaultPreferences, ...prefs },
    });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({ success: false, error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'notif-prefs-write');
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
    const parsed = PreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Dados invalidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const prefs: NotificationPreferences = {
      email_glosas: parsed.data.email_glosas ?? defaultPreferences.email_glosas,
      email_pagamentos: parsed.data.email_pagamentos ?? defaultPreferences.email_pagamentos,
      email_contas: parsed.data.email_contas ?? defaultPreferences.email_contas,
      push_enabled: parsed.data.push_enabled ?? defaultPreferences.push_enabled,
    };

    const { error } = await supabase.auth.updateUser({
      data: { notification_preferences: prefs },
    });

    if (error) throw error;

    return NextResponse.json({ success: true, data: prefs });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({ success: false, error: error.message || 'Erro interno' }, { status: 500 });
  }
}
