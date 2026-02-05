import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    let query = supabaseAdmin
      .from('tuss_procedures')
      .select('*')
      .eq('active', true);

    if (search) {
      // Search by code or description
      query = query.or(`code.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query
      .order('code')
      .limit(limit);

    if (error) {
      // If table doesn't exist, return empty array
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
