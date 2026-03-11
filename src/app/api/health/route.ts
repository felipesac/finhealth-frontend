import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function GET(request: Request) {
  try {
    const rlKey = getRateLimitKey(request, 'health');
    const { success: allowed } = await rateLimit(rlKey, { limit: 60, windowSeconds: 60 });
    if (!allowed) {
      return NextResponse.json({ status: 'rate_limited' }, { status: 429 });
    }

    const services: Record<string, string> = { db: 'unknown' };
    let overall: 'healthy' | 'unhealthy' = 'healthy';

    // DB connectivity check
    try {
      const supabase = await createClient();
      const { error } = await supabase.from('health_insurers').select('id').limit(1);
      services.db = error ? 'unhealthy' : 'healthy';
    } catch {
      services.db = 'unhealthy';
    }

    if (services.db === 'unhealthy') overall = 'unhealthy';

    return NextResponse.json(
      {
        status: overall,
        services,
        timestamp: new Date().toISOString(),
      },
      { status: overall === 'unhealthy' ? 503 : 200 }
    );
  } catch {
    return NextResponse.json(
      { status: 'unhealthy', services: { db: 'unhealthy' }, timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
