import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    const supabase = await createClient();
    const auth = await checkPermission(supabase, 'tiss:read');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let query = supabase
      .from('tuss_procedures')
      .select('*')
      .eq('active', true);

    if (search) {
      query = query.or(`code.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query
      .order('code')
      .limit(limit);

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ data: [], message: 'Table not created yet' });
      }
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { error: err.message || 'Failed to fetch TUSS procedures' },
      { status: 500 }
    );
  }
}
