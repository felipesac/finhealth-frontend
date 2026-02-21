import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { z } from 'zod';

const TissSettingsSchema = z.object({
  tiss_version: z.string().min(1).optional().default('3.05.00'),
  cnes: z.string().regex(/^\d{7}$/, 'CNES deve ter 7 digitos numericos').or(z.literal('')).optional().default(''),
});

interface TissSettings {
  tiss_version: string;
  cnes: string;
}

const defaultSettings: TissSettings = {
  tiss_version: '3.05.00',
  cnes: '',
};

export async function GET(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'tiss-settings-read');
    const { success: allowed } = await rateLimit(rlKey, { limit: 30, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'settings:read');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { data: { user } } = await supabase.auth.getUser();
    const settings = user?.user_metadata?.tiss_settings as Partial<TissSettings> | undefined;

    return NextResponse.json({
      success: true,
      data: { ...defaultSettings, ...settings },
    });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({ success: false, error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'tiss-settings-write');
    const { success: allowed } = await rateLimit(rlKey, { limit: 10, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisicoes. Tente novamente em breve.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'settings:write');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = TissSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Dados invalidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const settings: TissSettings = { tiss_version: parsed.data.tiss_version, cnes: parsed.data.cnes };

    const { error } = await supabase.auth.updateUser({
      data: { tiss_settings: settings },
    });

    if (error) throw error;

    return NextResponse.json({ success: true, data: settings });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({ success: false, error: error.message || 'Erro interno' }, { status: 500 });
  }
}
