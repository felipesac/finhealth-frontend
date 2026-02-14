import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';

export async function GET() {
  try {
    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'notifications:read');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const user = { id: auth.userId, email: auth.email };

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ data: [], unreadCount: 0 });
      }
      throw error;
    }

    const unreadCount = (notifications || []).filter((n) => !n.read).length;

    return NextResponse.json({ data: notifications || [], unreadCount });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'notifications:write');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const user = { id: auth.userId, email: auth.email };

    const body = await request.json();
    const { id, markAllRead } = body as { id?: string; markAllRead?: boolean };

    if (markAllRead) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (id) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Informe id ou markAllRead' }, { status: 400 });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
