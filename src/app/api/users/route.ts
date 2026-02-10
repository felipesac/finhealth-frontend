import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inviteUserSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { auditLog, getClientIp } from '@/lib/audit-logger';
import { checkPermission } from '@/lib/rbac';

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

    const { data: profiles, error } = await supabase
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

    // Insert into profiles table (user will be created when they accept invite / sign up)
    const { data: profile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        email: parsed.data.email,
        name: parsed.data.name,
        role: parsed.data.role,
        active: true,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Este email ja esta cadastrado' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: `Falha ao convidar usuario: ${insertError.message}` },
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

    return NextResponse.json({ success: true, data: profile });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err.message || 'Falha ao convidar usuario' },
      { status: 500 }
    );
  }
}
