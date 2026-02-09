import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { sendNotificationEmail, type EmailType } from '@/lib/email';
import { sendPushNotification, type PushSubscriptionData } from '@/lib/push';

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'notification-send');
    const { success: allowed } = rateLimit(rlKey, { limit: 10, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json({ error: 'Muitas requisicoes' }, { status: 429 });
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'notifications:write');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { type, subject, data, user_id } = body as {
      type: EmailType;
      subject: string;
      data: Record<string, string | number>;
      user_id?: string;
    };

    if (!type || !subject) {
      return NextResponse.json({ error: 'type e subject sao obrigatorios' }, { status: 400 });
    }

    const targetUserId = user_id || auth.userId;

    // Get target user's preferences and email
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    const prefs = user.user_metadata?.notification_preferences || {};
    const results: { email?: { success: boolean }; push?: { success: boolean } } = {};

    // Check email preference for this type
    const emailPrefKey = `email_${type === 'glosa' ? 'glosas' : type === 'pagamento' ? 'pagamentos' : 'contas'}`;
    if (prefs[emailPrefKey] !== false && user.email) {
      results.email = await sendNotificationEmail({
        to: user.email,
        type,
        subject,
        data,
      });
    }

    // Check push preference
    if (prefs.push_enabled) {
      const pushSub = user.user_metadata?.push_subscription as PushSubscriptionData | undefined;
      if (pushSub) {
        results.push = await sendPushNotification(pushSub, {
          title: subject,
          body: String(data.message || data.account_number || ''),
          url: String(data.url || '/dashboard'),
        });
      }
    }

    // Also store as in-app notification
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      title: subject,
      message: String(data.message || ''),
      type: type === 'glosa' ? 'warning' : type === 'pagamento' ? 'success' : 'info',
      href: String(data.url || null),
      read: false,
    }).select().single();

    return NextResponse.json({ success: true, results });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
