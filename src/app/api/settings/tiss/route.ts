import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';

interface TissSettings {
  tiss_version: string;
  cnes: string;
}

const defaultSettings: TissSettings = {
  tiss_version: '3.05.00',
  cnes: '',
};

export async function GET() {
  try {
    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'settings:read');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { data: { user } } = await supabase.auth.getUser();
    const settings = user?.user_metadata?.tiss_settings as Partial<TissSettings> | undefined;

    return NextResponse.json({
      data: { ...defaultSettings, ...settings },
    });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({ success: false, error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'settings:write');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();

    const tissVersion = String(body.tiss_version || '3.05.00').trim();
    const cnes = String(body.cnes || '').trim();

    if (cnes && !/^\d{7}$/.test(cnes)) {
      return NextResponse.json(
        { success: false, error: 'CNES deve ter 7 digitos numericos' },
        { status: 400 }
      );
    }

    const settings: TissSettings = { tiss_version: tissVersion, cnes };

    const { error } = await supabase.auth.updateUser({
      data: { tiss_settings: settings },
    });

    if (error) throw error;

    return NextResponse.json({ data: settings });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({ success: false, error: error.message || 'Erro interno' }, { status: 500 });
  }
}
