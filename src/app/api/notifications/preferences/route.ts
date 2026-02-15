import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

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
    const prefs: NotificationPreferences = {
      email_glosas: Boolean(body.email_glosas),
      email_pagamentos: Boolean(body.email_pagamentos),
      email_contas: Boolean(body.email_contas),
      push_enabled: Boolean(body.push_enabled),
    };

    const { error } = await supabase.auth.updateUser({
      data: { notification_preferences: prefs },
    });

    if (error) throw error;

    return NextResponse.json({ data: prefs });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({ success: false, error: error.message || 'Erro interno' }, { status: 500 });
  }
}
