import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { updateUserRoleSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { checkPermission } from '@/lib/rbac';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rlKey = getRateLimitKey(request, 'users-update');
    const { success: allowed } = await rateLimit(rlKey, { limit: 20, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'admin:all');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    if (id === auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Voce nao pode alterar seu proprio perfil' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = updateUserRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ role: parsed.data.role })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: `Falha ao atualizar usuario: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Sync role to Auth user_metadata
    if (updated.user_id) {
      await supabaseAdmin.auth.admin.updateUserById(updated.user_id, {
        user_metadata: { role: parsed.data.role },
      });
    }

    auditLog(supabase, auth.userId, {
      action: 'user.update_role',
      resource: 'profiles',
      resource_id: id,
      details: { new_role: parsed.data.role },
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao atualizar usuario' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rlKey = getRateLimitKey(request, 'users-delete');
    const { success: allowed } = await rateLimit(rlKey, { limit: 10, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'admin:all');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    if (id === auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Voce nao pode desativar seu proprio perfil' },
        { status: 400 }
      );
    }

    // Get profile to find user_id for Auth ban
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('id', id)
      .single();

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ active: false })
      .eq('id', id);

    // Also ban the Auth user to prevent login
    if (profile?.user_id) {
      await supabaseAdmin.auth.admin.updateUserById(profile.user_id, {
        ban_duration: '876000h', // ~100 years
      });
    }

    if (updateError) {
      return NextResponse.json(
        { success: false, error: `Falha ao desativar usuario: ${updateError.message}` },
        { status: 500 }
      );
    }

    auditLog(supabase, auth.userId, {
      action: 'user.deactivate',
      resource: 'profiles',
      resource_id: id,
      details: {},
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, message: 'Usuario desativado' });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao desativar usuario' },
      { status: 500 }
    );
  }
}
