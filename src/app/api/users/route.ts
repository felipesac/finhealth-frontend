import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { inviteUserSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { checkPermission } from '@/lib/rbac';
import { sendNotificationEmail } from '@/lib/email';

export async function GET(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'users-list');
    const { success: allowed } = await rateLimit(rlKey, { limit: 30, windowSeconds: 60 });
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

    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, role, active, created_at, last_sign_in_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: `Falha ao listar usuarios: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: profiles || [] });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao listar usuarios' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'users-invite');
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

    const body = await request.json();
    const parsed = inviteUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // 1. Create user in Supabase Auth via admin API
    const tempPassword = `FH${Date.now()}!x`;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: parsed.data.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: parsed.data.name, role: parsed.data.role },
    });

    if (authError) {
      if (authError.message?.includes('already been registered')) {
        return NextResponse.json(
          { success: false, error: 'Este email ja esta cadastrado no Auth' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: `Falha ao criar usuario: ${authError.message}` },
        { status: 500 }
      );
    }

    // 2. Insert into profiles table linked to Auth user
    const { data: profile, error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        email: parsed.data.email,
        name: parsed.data.name,
        role: parsed.data.role,
        active: true,
      })
      .select()
      .single();

    if (insertError) {
      // Rollback: delete the Auth user if profile insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      if (insertError.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Este email ja esta cadastrado' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: `Falha ao criar perfil: ${insertError.message}` },
        { status: 500 }
      );
    }

    auditLog(supabase, auth.userId, {
      action: 'user.invite',
      resource: 'profiles',
      resource_id: profile.id,
      details: { email: parsed.data.email, role: parsed.data.role },
      ip: getClientIp(request),
    });

    // 3. Send invite email (non-blocking — admin sees password in modal as fallback)
    const roleLabels: Record<string, string> = {
      admin: 'Administrador',
      finance_manager: 'Gestor Financeiro',
      auditor: 'Auditor',
      tiss_operator: 'Operador TISS',
    };
    let emailSent = false;
    try {
      const emailResult = await sendNotificationEmail({
        to: parsed.data.email,
        type: 'invite',
        subject: 'Convite para acessar o FinHealth',
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          password: tempPassword,
          role: roleLabels[parsed.data.role] || parsed.data.role,
          url: 'https://finhealth-frontend.vercel.app',
        },
      });
      emailSent = !!emailResult.success;
    } catch (emailErr) {
      console.error('[users/invite] Email send failed:', emailErr);
    }

    return NextResponse.json({ success: true, data: profile, tempPassword, emailSent });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao convidar usuario' },
      { status: 500 }
    );
  }
}
